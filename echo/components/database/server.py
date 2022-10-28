import os
import pathlib
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Type

import uvicorn
from fastapi import FastAPI
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.storage import Path
from lightning.app.utilities.app_helpers import Logger
from sqlmodel import Session, SQLModel, select

from echo.models.echo import Echo
from echo.models.general import GeneralModel
from echo.models.segment import Segment
from echo.models.utils import get_primary_key
from echo.monitoring.sentry import init_sentry
from echo.utils.dependencies import RUST_INSTALL_SCRIPT

logger = Logger(__name__)


DEFAULT_CLOUD_COMPUTE = "cpu"

engine = None


def list_echoes(user_id: Optional[str] = None, created_before: Optional[int] = None):
    with Session(engine) as session:
        statement = select(Echo)
        if user_id:
            statement = statement.where(Echo.user_id == user_id)
        if created_before:
            statement = statement.where(Echo.created_at < datetime.fromtimestamp(created_before))

        results = session.exec(statement)
        return results.all()


def get_echo(echo_id: str):
    with Session(engine) as session:
        statement = select(Echo).where(Echo.id == echo_id)
        results = session.exec(statement)
        return results.first()


def list_segments_for_echo(echo_id: str):
    with Session(engine) as session:
        statement = select(Segment).where(Segment.echo_id == echo_id).order_by(Segment.start)
        results = session.exec(statement)
        return results.all()


def delete_echo(echo_id: str):
    with Session(engine) as session:
        statement = select(Echo).where(Echo.id == echo_id)
        results = session.exec(statement)
        result = results.one()
        session.delete(result)
        session.commit()


def create_segments_for_echo(segments: List[Segment]):
    with Session(engine) as session:
        session.add_all(segments)
        session.commit()


def delete_segments_for_echo(echo_id: str):
    with Session(engine) as session:
        statement = select(Segment).where(Segment.echo_id == echo_id)
        results = session.exec(statement)
        for result in results:
            session.delete(result)
        session.commit()


def general_post(config: GeneralModel):
    with Session(engine) as session:
        data = config.convert_to_model()
        session.add(data)
        session.commit()
        session.refresh(data)
        return data


def general_put(config: GeneralModel):
    with Session(engine) as session:
        update_data = config.convert_to_model()
        primary_key = get_primary_key(update_data.__class__)
        identifier = getattr(update_data.__class__, primary_key, None)
        statement = select(update_data.__class__).where(identifier == getattr(update_data, primary_key))
        results = session.exec(statement)
        result = results.one()
        for k, v in vars(update_data).items():
            if k in ("id", "_sa_instance_state"):
                continue
            if getattr(result, k) != v:
                setattr(result, k, v)
        session.add(result)
        session.commit()
        session.refresh(result)


def create_engine(db_file_name: str, models: List[Type[SQLModel]], echo: bool):
    global engine

    from sqlmodel import SQLModel, create_engine

    engine = create_engine(f"sqlite:///{pathlib.Path(db_file_name).resolve()}", echo=echo)

    logger.debug(f"Creating the following tables {models}")
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        logger.debug(e)


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return ["sudo apt-get update", RUST_INSTALL_SCRIPT]


class Database(LightningWork):
    def __init__(
        self,
        db_file_name: str = "database.db",
        debug: bool = False,
        models: Optional[List[Type[SQLModel]]] = None,
        cloud_compute=DEFAULT_CLOUD_COMPUTE,
    ):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute(cloud_compute),
            cloud_build_config=CustomBuildConfig(requirements=["sqlmodel"]),
        )

        init_sentry()

        self.db_file_name = Path(db_file_name)
        self.debug = debug
        self._models = models

    def run(self):
        app = FastAPI()

        create_engine(self.db_file_name, self._models, self.debug)

        app.get("/echoes/")(list_echoes)
        app.get("/echoes/{echo_id}")(get_echo)
        app.get("/segments/")(list_segments_for_echo)
        app.delete("/echoes/{echo_id}")(delete_echo)
        app.post("/segments")(create_segments_for_echo)
        app.delete("/segments/")(delete_segments_for_echo)

        app.post("/general/")(general_post)
        app.put("/general/")(general_put)

        uvicorn.run(app, host=self.host, port=self.port, log_level="error")

    def alive(self):
        """Hack: Returns whether the server is alive."""
        return self.db_url != ""

    @property
    def db_url(self) -> Optional[str]:
        use_localhost = "lightning.app_STATE_URL" not in os.environ
        if use_localhost:
            return self.url
        if self.internal_ip != "":
            return f"http://{self.internal_ip}:{self.port}"
        return self.internal_ip
