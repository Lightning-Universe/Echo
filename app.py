import os
import time
import uuid
from typing import List

from lightning import LightningApp, LightningFlow
from lightning_app.frontend import StaticWebFrontend
from lightning_app.storage import Drive
from lightning_app.utilities.app_helpers import Logger
from lightning_app.utilities.enum import WorkStageStatus

from echo.commands.echo import CreateEcho, DeleteEcho, GetEcho, ListEchoes
from echo.components.database.client import DatabaseClient
from echo.components.database.server import Database
from echo.components.fileserver import FileServer
from echo.components.recognizer import SpeechRecognizer
from echo.constants import SHARED_STORAGE_DRIVE_ID
from echo.models.echo import DeleteEchoConfig, Echo, GetEchoConfig

logger = Logger(__name__)


RECOGNIZER_ATTRIBUTE_PREFIX = "recognizer_"


class EchoApp(LightningFlow):
    def __init__(self):
        super().__init__()

        # Read config from environment variables
        self.model_size = os.environ.get("ECHO_MODEL_SIZE", "base")
        self.recognizer_pool_size = int(os.environ.get("ECHO_RECOGNIZER_POOL_SIZE", 3))
        self.recognizer_min_replicas = int(os.environ.get("ECHO_RECOGNIZER_MIN_REPLICAS", 1))
        self.recognizer_idle_seconds_before_scale_down = int(
            os.environ.get("ECHO_RECOGNIZER_IDLE_SECONDS_BEFORE_SCALE_DOWN", 120)
        )

        # Need to wait for database to be ready before initializing client
        self._db_client = None

        # Initialize shared storage for transferring audio files to recognizers
        self.drive = Drive(id=SHARED_STORAGE_DRIVE_ID, allow_duplicates=True)

        # Initialize child components
        self.fileserver = FileServer(drive=self.drive)
        self.database = Database(models=[Echo])

        self._running_recognizers = 0
        self._recognizers: List[str] = []
        for _ in range(self.recognizer_pool_size):
            # NOTE: Using `setattr` to dynamically add Works to the Flow because `structures.List` isn't working
            self.add_recognizer(SpeechRecognizer(model_size=self.model_size, drive=self.drive))

    def run(self):
        # Run child components
        # FIXME(alecmerdler): For some reason, all Works are loading the Whisper model which takes a long time...
        self.database.run()
        self.fileserver.run()

        if self.database.alive() and self._db_client is None:
            self._db_client = DatabaseClient(model=Echo, db_url=self.database.db_url)

        # Watch recognizer pool and scale down if idle for too long to save on cloud compute costs
        self.ensure_min_replicas()

    def ensure_min_replicas(self):
        # Only check to scale down if there are more than the minimum number of replicas
        while self._running_recognizers > self.recognizer_min_replicas:
            for recognizer in self.recognizer_pool:
                status = recognizer.status
                surpassed_idle_timeout = (
                    status.timestamp + self.recognizer_idle_seconds_before_scale_down
                ) < time.time()

                if recognizer.idle and surpassed_idle_timeout:
                    logger.info("Scaling down idle recognizer...")
                    recognizer.stop()
                    self._running_recognizers -= 1

    def add_recognizer(self, recognizer: SpeechRecognizer):
        """Adds a new recognizer Work to the Flow using `setattr` and a unique attribute name."""
        work_attribute = f"{RECOGNIZER_ATTRIBUTE_PREFIX}{uuid.uuid4().hex}"
        self._recognizers.append(work_attribute)
        setattr(self, work_attribute, recognizer)

        return work_attribute

    @property
    def recognizer_pool(self) -> List[SpeechRecognizer]:
        """Returns the list of recognizer Works."""
        return [getattr(self, attr) for attr in self._recognizers]

    def configure_layout(self):
        return StaticWebFrontend(os.path.join(os.path.dirname(__file__), "echo", "ui", "build"))

    def create_echo(self, echo: Echo) -> Echo:
        if self._db_client is None:
            raise RuntimeError("Database client not initialized!")

        # Create Echo in the database
        self._db_client.post(echo)

        # Lazily run the first recognizer only after the first Echo is created.
        # This reduces the cost of running the app on cloud machines.
        while True:
            # Try to use an already running idle machine first
            for recognizer in self.recognizer_pool:
                if recognizer.idle:
                    logger.info(f"Found idle recognizer, running on {recognizer.name}...")
                    recognizer.run(echo, db_url=self.database.db_url)

                    return echo

            # Next, try running a new machine
            for recognizer in self.recognizer_pool:
                if recognizer.status.stage in [WorkStageStatus.STOPPED, WorkStageStatus.NOT_STARTED]:
                    logger.info(f"No idle recognizers found, running on {recognizer.name}...")
                    recognizer.run(echo, db_url=self.database.db_url)
                    self._running_recognizers += 1

                    return echo

            # If all machines are busy, add to the last called Work's queue
            recognizers_by_last_called: List[SpeechRecognizer] = sorted(
                self.recognizer_pool, key=lambda r: r.last_called_timestamp
            )

            for recognizer in recognizers_by_last_called:
                if recognizer.status.stage == WorkStageStatus.RUNNING:
                    logger.info(f"No idle recognizers found, running on {recognizer.name}...")
                    recognizer.run(echo, db_url=self.database.db_url)

                    return echo

    def list_echoes(self) -> List[Echo]:
        if self._db_client is None:
            raise RuntimeError("Database client not initialized!")

        return self._db_client.get()

    def get_echo(self, config: GetEchoConfig) -> Echo:
        if self._db_client is None:
            raise RuntimeError("Database client not initialized!")

        echoes: List[Echo] = self._db_client.get()
        for echo in echoes:
            if echo.id == config.echo_id:
                return echo

        raise ValueError(f"Echo with ID '{config.id}' not found!")

    def delete_echo(self, config: DeleteEchoConfig) -> None:
        if self._db_client is None:
            raise RuntimeError("Database client not initialized!")

        return self._db_client.delete(config=Echo(id=config.echo_id))

    def configure_api(self):
        return []

    def configure_commands(self):
        return [
            {"create echo": CreateEcho(method=self.create_echo)},
            {"list echoes": ListEchoes(method=self.list_echoes)},
            {"get echo": GetEcho(method=self.get_echo)},
            {"delete echo": DeleteEcho(method=self.delete_echo)},
        ]


app = LightningApp(EchoApp())
