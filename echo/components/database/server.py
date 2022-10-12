import os
import pathlib
from typing import List, Optional, Type

from fastapi import FastAPI
from lightning import BuildConfig, LightningWork
from lightning_app.storage import Path
from lightning_app.utilities.app_helpers import Logger
from sqlmodel import Session, SQLModel, select
from uvicorn import run

from echo.models.general import GeneralModel
from echo.models.utils import get_primary_key
from echo.monitoring.sentry import init_sentry

logger = Logger(__name__)

engine = None


def general_get(config: GeneralModel):
    with Session(engine) as session:
        statement = select(config.data_cls)
        results = session.exec(statement)
        return results.all()


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


def general_delete(config: GeneralModel):
    with Session(engine) as session:
        update_data = config.convert_to_model()
        primary_key = get_primary_key(update_data.__class__)
        identifier = getattr(update_data.__class__, primary_key, None)
        statement = select(update_data.__class__).where(identifier == getattr(update_data, primary_key))
        results = session.exec(statement)
        result = results.one()
        session.delete(result)
        session.commit()


def create_engine(db_file_name: str, models: List[Type[SQLModel]], echo: bool):
    global engine

    from sqlmodel import SQLModel, create_engine

    engine = create_engine(f"sqlite:///{pathlib.Path(db_file_name).resolve()}", echo=echo)

    logger.debug(f"Creating the following tables {models}")
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        logger.debug(e)


class Database(LightningWork):
    def __init__(
        self,
        db_file_name: str = "database.db",
        debug: bool = False,
        models: Optional[List[Type[SQLModel]]] = None,
    ):
        super().__init__(parallel=True, cloud_build_config=BuildConfig(["sqlmodel"]))

        init_sentry()

        self.db_file_name = Path(db_file_name)
        self.debug = debug
        self._models = models

    def run(self):
        app = FastAPI()

        create_engine(self.db_file_name, self._models, self.debug)

        app.get("/general/")(general_get)
        app.post("/general/")(general_post)
        app.put("/general/")(general_put)
        app.delete("/general/")(general_delete)

        run(app, host=self.host, port=self.port, log_level="error")

    def alive(self):
        """Hack: Returns whether the server is alive."""
        return self.db_url != ""

    @property
    def db_url(self) -> Optional[str]:
        use_localhost = "LIGHTNING_APP_STATE_URL" not in os.environ
        if use_localhost:
            return self.url
        if self.internal_ip != "":
            return f"http://{self.internal_ip}:{self.port}"
        return self.internal_ip
