import os
import uuid
from typing import List

from lightning import LightningApp, LightningFlow
from lightning_app.frontend import StaticWebFrontend
from lightning_app.storage import Drive
from lightning_app.utilities.app_helpers import Logger

from echo.authn.session import DEFAULT_USER_ID
from echo.commands.auth import Login
from echo.commands.echo import CreateEcho, DeleteEcho, GetEcho, ListEchoes
from echo.components.database.client import DatabaseClient
from echo.components.database.server import Database
from echo.components.fileserver import FileServer
from echo.components.loadbalancing.loadbalancer import LoadBalancer
from echo.components.recognizer import SpeechRecognizer
from echo.components.youtuber import YouTuber
from echo.constants import SHARED_STORAGE_DRIVE_ID
from echo.models.auth import LoginResponse
from echo.models.echo import (
    DeleteEchoConfig,
    Echo,
    GetEchoConfig,
    GetEchoResponse,
    ListEchoesConfig,
)
from echo.models.segment import Segment
from echo.monitoring.sentry import init_sentry

logger = Logger(__name__)


RECOGNIZER_ATTRIBUTE_PREFIX = "recognizer_"

RECOGNIZER_MIN_REPLICAS_DEFAULT = 1
RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT = 120
RECOGNIZER_MAX_PENDING_CALLS_PER_WORK_DEFAULT = 10
RECOGNIZER_AUTOSCALER_CROM_SCHEDULE_DEFAULT = "*/5 * * * *"

YOUTUBER_MIN_REPLICAS_DEFAULT = 1
YOUTUBER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT = 120
YOUTUBER_MAX_PENDING_CALLS_PER_WORK_DEFAULT = 10
YOUTUBER_AUTOSCALER_CROM_SCHEDULE_DEFAULT = "*/5 * * * *"

# FIXME: Duplicating this from `recognizer.py` because `lightning run app` gives import error...
DUMMY_ECHO_ID = "dummy"
DUMMY_YOUTUBE_URL = "dummy"


class WebFrontend(LightningFlow):
    def configure_layout(self):
        return StaticWebFrontend(os.path.join(os.path.dirname(__file__), "echo", "ui", "build"))


class EchoApp(LightningFlow):
    def __init__(self):
        super().__init__()

        init_sentry()

        # Read config from environment variables
        self.model_size = os.environ.get("ECHO_MODEL_SIZE", "base")
        self.enable_multi_tenancy = os.environ.get("ECHO_ENABLE_MULTI_TENANCY", "false").lower() == "true"
        self.recognizer_min_replicas = int(
            os.environ.get("ECHO_RECOGNIZER_MIN_REPLICAS", RECOGNIZER_MIN_REPLICAS_DEFAULT)
        )
        self.recognizer_max_idle_seconds_per_work = int(
            os.environ.get("ECHO_RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK", RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT)
        )
        self.recognizer_max_pending_calls_per_work = int(
            os.environ.get("ECHO_RECOGNIZER_MAX_PENDING_CALLS_PER_WORK", RECOGNIZER_MAX_PENDING_CALLS_PER_WORK_DEFAULT)
        )
        self.recognizer_autoscaler_cron_schedule = os.environ.get(
            "ECHO_RECOGNIZER_AUTOSCALER_CROM_SCHEDULE_DEFAULT", RECOGNIZER_AUTOSCALER_CROM_SCHEDULE_DEFAULT
        )
        self.youtuber_min_replicas = int(os.environ.get("ECHO_YOUTUBER_MIN_REPLICAS", YOUTUBER_MIN_REPLICAS_DEFAULT))
        self.youtuber_max_idle_seconds_per_work = int(
            os.environ.get("ECHO_YOUTUBER_MAX_IDLE_SECONDS_PER_WORK", YOUTUBER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT)
        )
        self.youtuber_max_pending_calls_per_work = int(
            os.environ.get("ECHO_YOUTUBER_MAX_PENDING_CALLS_PER_WORK", YOUTUBER_MAX_PENDING_CALLS_PER_WORK_DEFAULT)
        )
        self.youtuber_autoscaler_cron_schedule = os.environ.get(
            "ECHO_YOUTUBER_AUTOSCALER_CROM_SCHEDULE_DEFAULT", YOUTUBER_AUTOSCALER_CROM_SCHEDULE_DEFAULT
        )
        self.source_type_file_enabled = os.environ.get("ECHO_SOURCE_TYPE_FILE_ENABLED", "true").lower() == "true"
        self.source_type_recording_enabled = (
            os.environ.get("ECHO_SOURCE_TYPE_RECORDING_ENABLED", "true").lower() == "true"
        )
        self.source_type_youtube_enabled = os.environ.get("ECHO_SOURCE_TYPE_YOUTUBE_ENABLED", "true").lower() == "true"

        # Need to wait for database to be ready before initializing clients
        self._echo_db_client = None
        self._segment_db_client = None

        # Initialize shared storage for transferring media files to recognizers
        self.drive = Drive(id=SHARED_STORAGE_DRIVE_ID, allow_duplicates=False, component_name="echo")

        base_dir = os.path.join(os.path.dirname(__file__), "fileserver")

        # Initialize child components
        self.web_frontend = WebFrontend()
        self.fileserver = FileServer(drive=self.drive, base_dir=base_dir)
        self.database = Database(models=[Echo])
        self.youtuber = LoadBalancer(
            name="youtuber",
            min_replicas=self.youtuber_min_replicas,
            max_idle_seconds_per_work=self.youtuber_max_idle_seconds_per_work,
            max_pending_calls_per_work=self.youtuber_max_pending_calls_per_work,
            create_work=lambda: YouTuber(drive=self.drive, base_dir=base_dir),
        )
        self.recognizer = LoadBalancer(
            name="recognizer",
            min_replicas=self.recognizer_min_replicas,
            max_idle_seconds_per_work=self.recognizer_max_idle_seconds_per_work,
            max_pending_calls_per_work=self.recognizer_max_pending_calls_per_work,
            create_work=lambda: SpeechRecognizer(drive=self.drive, model_size=self.model_size),
        )

    def run(self):
        # Run child components
        self.database.run()
        self.fileserver.run()

        if self.database.alive() and self._echo_db_client is None:
            self._echo_db_client = DatabaseClient(model=Echo, db_url=self.database.db_url)
            self._segment_db_client = DatabaseClient(model=Segment, db_url=self.database.db_url)

            # NOTE: Calling `self.recognizer.run()` with a dummy Echo so that the cloud machine is created
            for _ in range(self.recognizer_min_replicas):
                self.recognizer.run(
                    Echo(id=DUMMY_ECHO_ID, media_type="audio/mp3", audio_url="dummy", text=""), db_url=self.database.url
                )

            if self.source_type_youtube_enabled:
                # NOTE: Calling `self.youtuber.run()` with a dummy Echo so that the cloud machine is created
                for _ in range(self.youtuber_min_replicas):
                    self.youtuber.run(youtube_url=DUMMY_YOUTUBE_URL, echo_id=DUMMY_ECHO_ID)

        if self.schedule(self.recognizer_autoscaler_cron_schedule):
            self.recognizer.ensure_min_replicas()

        if self.schedule(self.youtuber_autoscaler_cron_schedule):
            self.youtuber.ensure_min_replicas()

    def create_echo(self, echo: Echo) -> Echo:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        # Guard against disabled source types
        if echo.source_youtube_url is None:
            if not self.source_type_recording_enabled or not self.source_type_file_enabled:
                logger.warn("Source type file/recording is disabled!")
                return None
        else:
            if not self.source_type_youtube_enabled:
                logger.warn("Source type YouTube is disabled!")
                return None

        # Create Echo in the database
        self._echo_db_client.post(echo)

        # If source is YouTube, trigger async download of the video to the shared Drive
        if echo.source_youtube_url is not None:
            self.youtuber.run(youtube_url=echo.source_youtube_url, echo_id=echo.id)

        # Run speech recognition for the Echo
        self.recognizer.run(echo, db_url=self.database.url)

    def list_echoes(self, config: ListEchoesConfig) -> List[Echo]:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        echoes = self._echo_db_client.list_echoes_for_user(config.user_id)

        return echoes

    def get_echo(self, config: GetEchoConfig) -> GetEchoResponse:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        echo = self._echo_db_client.get_echo(config.echo_id)
        segments = None
        if config.include_segments:
            segments = self._segment_db_client.list_segments_for_echo(config.echo_id)

        return GetEchoResponse(echo=echo, segments=segments)

    def delete_echo(self, config: DeleteEchoConfig) -> None:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        self._segment_db_client.delete_segments_for_echo(config.echo_id)
        self._echo_db_client.delete_echo(config.echo_id)

        return None

    def login(self):
        if not self.enable_multi_tenancy:
            return LoginResponse(user_id=DEFAULT_USER_ID)

        new_user_id = str(uuid.uuid4())

        return LoginResponse(user_id=new_user_id)

    def configure_commands(self):
        return [
            {"create echo": CreateEcho(method=self.create_echo)},
            {"list echoes": ListEchoes(method=self.list_echoes)},
            {"get echo": GetEcho(method=self.get_echo)},
            {"delete echo": DeleteEcho(method=self.delete_echo)},
            {"login": Login(method=self.login)},
        ]

    def configure_layout(self):
        mode = os.environ.get("ECHO_MODE", "production")
        dev_frontend_server = os.environ.get("ECHO_FRONTEND_SERVER", "http://localhost:3000")
        content = self.web_frontend if mode == "production" else dev_frontend_server

        return [{"name": "home", "content": content}]


app = LightningApp(EchoApp())
