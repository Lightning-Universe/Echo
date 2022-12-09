import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

import requests
from fastapi import HTTPException
from lightning import LightningApp, LightningFlow
from lightning.app.api.http_methods import Delete, Get, Post
from lightning.app.frontend import StaticWebFrontend
from lightning.app.storage import Drive
from lightning.app.utilities.app_helpers import Logger
from lightning.app.utilities.frontend import AppInfo

from echo.authn.session import DEFAULT_USER_ID
from echo.commands.auth import Login
from echo.commands.echo import CreateEcho, DeleteEcho, GetEcho, ListEchoes
from echo.components.database.client import DatabaseClient
from echo.components.database.server import Database
from echo.components.downloader import Downloader
from echo.components.fileserver import FileServer
from echo.components.loadbalancing.loadbalancer import LoadBalancer
from echo.components.recognizer import SpeechRecognizer
from echo.components.youtuber import YouTuber
from echo.constants import SHARED_STORAGE_DRIVE_ID
from echo.media.video import is_valid_youtube_url, youtube_video_length
from echo.meta import app_meta
from echo.models.auth import LoginResponse
from echo.models.echo import (
    DeleteEchoConfig,
    Echo,
    GetEchoConfig,
    GetEchoResponse,
    ListEchoesConfig,
    ValidateEchoResponse,
)
from echo.models.loadbalancer import ScaleRequest
from echo.models.segment import Segment
from echo.monitoring.sentry import init_sentry
from echo.utils.analytics import analytics
from echo.utils.frontend import download_frontend_build

logger = Logger(__name__)


REST_API_TIMEOUT_SECONDS = 60 * 5

RECOGNIZER_ATTRIBUTE_PREFIX = "recognizer_"

RECOGNIZER_MIN_REPLICAS_DEFAULT = 1
RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT = 120
RECOGNIZER_MAX_PENDING_CALLS_PER_WORK_DEFAULT = 10
RECOGNIZER_AUTOSCALER_CRON_SCHEDULE_DEFAULT = "*/5 * * * *"
RECOGNIZER_CLOUD_COMPUTE_DEFAULT = "gpu"

FILESERVER_CLOUD_COMPUTE_DEFAULT = "cpu-small"

YOUTUBER_MIN_REPLICAS_DEFAULT = 1
YOUTUBER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT = 120
YOUTUBER_MAX_PENDING_CALLS_PER_WORK_DEFAULT = 10
YOUTUBER_AUTOSCALER_CRON_SCHEDULE_DEFAULT = "*/5 * * * *"
YOUTUBER_CLOUD_COMPUTE_DEFAULT = "cpu"

DATABASE_CLOUD_COMPUTE_DEFAULT = "cpu"

USER_ECHOES_LIMIT_DEFAULT = 100
SOURCE_TYPE_FILE_ENABLED_DEFAULT = "true"
SOURCE_TYPE_RECORDING_ENABLED_DEFAULT = "true"
SOURCE_TYPE_YOUTUBE_ENABLED_DEFAULT = "true"

VIDEO_SOURCE_MAX_DURATION_SECONDS_DEFAULT = 60 * 15
MAX_DISPLAY_NAME_LENGTH = 32

GARBAGE_COLLECTION_CRON_SCHEDULE_DEFAULT = None
GARBAGE_COLLECTION_MAX_AGE_SECONDS_DEFAULT = 60 * 60 * 24

# FIXME: Duplicating this from `recognizer.py` because `lightning run app` gives import error...
DUMMY_ECHO_ID = "dummy"
DUMMY_YOUTUBE_URL = "dummy"


dummy_echo = Echo(id=DUMMY_ECHO_ID, media_type="audio/mp3", audio_url="dummy", text="")


class WebFrontend(LightningFlow):
    """Serves the React frontend build."""

    def __init__(self):
        super().__init__()

        self._frontend_build_dir = Path(os.path.dirname(__file__), "echo", "ui", "build")

    def configure_layout(self):
        if not self._frontend_build_dir.exists():
            logger.info("Downloading frontend build")

            self._frontend_build_dir.mkdir()
            download_frontend_build(self._frontend_build_dir.absolute())

        return StaticWebFrontend(str(self._frontend_build_dir))


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
            "ECHO_RECOGNIZER_AUTOSCALER_CRON_SCHEDULE", RECOGNIZER_AUTOSCALER_CRON_SCHEDULE_DEFAULT
        )
        self.recognizer_cloud_compute = os.environ.get(
            "ECHO_RECOGNIZER_CLOUD_COMPUTE", RECOGNIZER_CLOUD_COMPUTE_DEFAULT
        )
        self.fileserver_cloud_compute = os.environ.get(
            "ECHO_FILESERVER_CLOUD_COMPUTE", FILESERVER_CLOUD_COMPUTE_DEFAULT
        )
        self._fileserver_auth_token = os.environ.get("ECHO_FILESERVER_AUTH_TOKEN", None)
        self.youtuber_min_replicas = int(os.environ.get("ECHO_YOUTUBER_MIN_REPLICAS", YOUTUBER_MIN_REPLICAS_DEFAULT))
        self.youtuber_max_idle_seconds_per_work = int(
            os.environ.get("ECHO_YOUTUBER_MAX_IDLE_SECONDS_PER_WORK", YOUTUBER_MAX_IDLE_SECONDS_PER_WORK_DEFAULT)
        )
        self.youtuber_max_pending_calls_per_work = int(
            os.environ.get("ECHO_YOUTUBER_MAX_PENDING_CALLS_PER_WORK", YOUTUBER_MAX_PENDING_CALLS_PER_WORK_DEFAULT)
        )
        self.youtuber_autoscaler_cron_schedule = os.environ.get(
            "ECHO_YOUTUBER_AUTOSCALER_CRON_SCHEDULE", YOUTUBER_AUTOSCALER_CRON_SCHEDULE_DEFAULT
        )
        self.youtuber_cloud_compute = os.environ.get("ECHO_YOUTUBER_CLOUD_COMPUTE", YOUTUBER_CLOUD_COMPUTE_DEFAULT)
        self.user_echoes_limit = int(os.environ.get("ECHO_USER_ECHOES_LIMIT", USER_ECHOES_LIMIT_DEFAULT))
        self.source_type_file_enabled = (
            os.environ.get("ECHO_SOURCE_TYPE_FILE_ENABLED", SOURCE_TYPE_FILE_ENABLED_DEFAULT) == "true"
        )
        self.source_type_recording_enabled = (
            os.environ.get("ECHO_SOURCE_TYPE_RECORDING_ENABLED", SOURCE_TYPE_RECORDING_ENABLED_DEFAULT) == "true"
        )
        self.source_type_youtube_enabled = (
            os.environ.get("ECHO_SOURCE_TYPE_YOUTUBE_ENABLED", SOURCE_TYPE_YOUTUBE_ENABLED_DEFAULT) == "true"
        )
        self.garbage_collection_cron_schedule = os.environ.get(
            "ECHO_GARBAGE_COLLECTION_CRON_SCHEDULE", GARBAGE_COLLECTION_CRON_SCHEDULE_DEFAULT
        )
        self.garbage_collection_max_age_seconds = int(
            os.environ.get("ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS", GARBAGE_COLLECTION_MAX_AGE_SECONDS_DEFAULT)
        )
        self.video_source_max_duration_seconds = int(
            os.environ.get("ECHO_VIDEO_SOURCE_MAX_DURATION_SECONDS", VIDEO_SOURCE_MAX_DURATION_SECONDS_DEFAULT)
        )
        self.database_cloud_compute = os.environ.get("ECHO_DATABASE_CLOUD_COMPUTE", DATABASE_CLOUD_COMPUTE_DEFAULT)
        self._loadbalancer_auth_token = os.environ.get("ECHO_LOADBALANCER_AUTH_TOKEN", None)

        # Need to wait for database to be ready before initializing clients
        self._echo_db_client = None
        self._segment_db_client = None

        # Initialize shared storage for transferring media files to recognizers
        self.drive = Drive(id=SHARED_STORAGE_DRIVE_ID, allow_duplicates=False, component_name="echo")

        base_dir = os.path.join(os.path.dirname(__file__), "fileserver")

        # Initialize child components
        self.web_frontend = WebFrontend()
        self.fileserver = FileServer(
            drive=self.drive,
            base_dir=base_dir,
            cloud_compute=self.fileserver_cloud_compute,
            auth_token=self._fileserver_auth_token,
        )
        self.database = Database(models=[Echo], cloud_compute=self.database_cloud_compute)
        self.youtuber = LoadBalancer(
            name="youtuber",
            max_idle_seconds_per_work=self.youtuber_max_idle_seconds_per_work,
            max_pending_calls_per_work=self.youtuber_max_pending_calls_per_work,
            create_work=lambda: Downloader(cloud_compute=self.youtuber_cloud_compute, base_dir=base_dir),
            dummy_run_kwargs={"source_url": DUMMY_YOUTUBE_URL, "echo_id": DUMMY_ECHO_ID, "fileserver_url": None},
        )
        self.recognizer = LoadBalancer(
            name="recognizer",
            max_idle_seconds_per_work=self.recognizer_max_idle_seconds_per_work,
            max_pending_calls_per_work=self.recognizer_max_pending_calls_per_work,
            create_work=lambda: SpeechRecognizer(
                cloud_compute=self.recognizer_cloud_compute, drive=self.drive, model_size=self.model_size
            ),
            dummy_run_kwargs={"echo": dummy_echo, "db_url": None},
        )

    def run(self):
        # Run child components
        self.database.run()
        self.fileserver.run()

        if self.database.alive() and self._echo_db_client is None:
            self._echo_db_client = DatabaseClient(model=Echo, db_url=self.database.db_url)
            self._segment_db_client = DatabaseClient(model=Segment, db_url=self.database.db_url)

        if self.schedule(self.recognizer_autoscaler_cron_schedule):
            self.recognizer.ensure_min_replicas(min_replicas=self.recognizer_min_replicas)

        if self.schedule(self.youtuber_autoscaler_cron_schedule) and self.source_type_youtube_enabled:
            self.youtuber.ensure_min_replicas(min_replicas=self.youtuber_min_replicas)

        if self.garbage_collection_cron_schedule and self.schedule(self.garbage_collection_cron_schedule):
            self._perform_garbage_collection()

    def _perform_garbage_collection(self):
        if self._echo_db_client is not None:
            created_before = datetime.now() - timedelta(seconds=self.garbage_collection_max_age_seconds)
            old_echoes = self._echo_db_client.list_echoes(user_id=None, created_before=int(created_before.timestamp()))
            for echo in old_echoes:
                logger.info(f"Deleting old Echo {echo.id}")
                self.delete_echo(config=DeleteEchoConfig(echo_id=echo.id))

    def create_echo(self, echo: Echo) -> Echo:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        # Create Echo in the database
        self._echo_db_client.post(echo)

        # If source is YouTube, trigger async download of the video to the shared Drive
        if echo.source_youtube_url is not None:
            self.youtuber.run(source_url=echo.source_youtube_url, echo_id=echo.id, fileserver_url=self.fileserver.url)

        # Run speech recognition for the Echo
        self.recognizer.run(echo=echo, db_url=self.database.url)

        return echo

    def list_echoes(self, config: ListEchoesConfig) -> List[Echo]:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        echoes = self._echo_db_client.list_echoes(config.user_id)

        return echoes

    def get_echo(self, config: GetEchoConfig):
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        echo = self._echo_db_client.get_echo(config.echo_id)
        if echo is None:
            return None

        segments = None
        if config.include_segments:
            segments = self._segment_db_client.list_segments_for_echo(config.echo_id)

        return GetEchoResponse(echo=echo, segments=segments)

    def delete_echo(self, config: DeleteEchoConfig) -> None:
        if self._echo_db_client is None:
            logger.warn("Database client not initialized!")
            return None

        try:
            self._segment_db_client.delete_segments_for_echo(config.echo_id)
            self._echo_db_client.delete_echo(config.echo_id)

            requests.post(
                f"{self.fileserver.url}/delete/{config.echo_id}",
                params={"auth_token": self._fileserver_auth_token if self._fileserver_auth_token else ""},
            )
        except Exception as e:
            logger.error(e)

        return None

    def login(self):
        if not self.enable_multi_tenancy:
            return LoginResponse(user_id=DEFAULT_USER_ID)

        new_user_id = str(uuid.uuid4())

        return LoginResponse(user_id=new_user_id)

    def validate_echo(self, echo: Echo) -> ValidateEchoResponse:
        # Guard against disabled source types
        if echo.source_youtube_url is not None:
            if not self.source_type_youtube_enabled:
                return ValidateEchoResponse(valid=False, reason="Source type YouTube is disabled")
        if echo.source_youtube_url is None:
            if not self.source_type_recording_enabled and not self.source_type_file_enabled:
                return ValidateEchoResponse(valid=False, reason="Source type file/recording is disabled")

        # Guard against invalid display name
        if echo.display_name is None or len(echo.display_name) == 0:
            return ValidateEchoResponse(valid=False, reason="Display name is required")

        if len(echo.display_name) > MAX_DISPLAY_NAME_LENGTH:
            return ValidateEchoResponse(
                valid=False, reason=f"Display name must be less than {MAX_DISPLAY_NAME_LENGTH} characters"
            )

        # Guard against exceeding per-user Echoes limit
        echoes = self._echo_db_client.list_echoes(echo.user_id)
        if len(echoes) >= self.user_echoes_limit:
            return ValidateEchoResponse(valid=False, reason="User Echoes limit exceeded")

        if echo.source_youtube_url is not None:
            if not is_valid_youtube_url(echo.source_youtube_url):
                return ValidateEchoResponse(valid=False, reason="Invalid YouTube URL")

            video_length = youtube_video_length(echo.source_youtube_url)
            if video_length > self.video_source_max_duration_seconds:
                return ValidateEchoResponse(valid=False, reason="YouTube video exceeds maximum duration allowed")

        return ValidateEchoResponse(valid=True, reason="All fields valid")

    def handle_create_echo(self, echo: Echo) -> Echo:
        validation = self.validate_echo(echo)
        if not validation.valid:
            raise HTTPException(status_code=400, detail=validation.reason)

        return self.create_echo(echo)

    def handle_list_echoes(self, user_id: str) -> List[Echo]:
        return self.list_echoes(ListEchoesConfig(user_id=user_id))

    def handle_get_echo(self, echo_id: str, include_segments: bool) -> GetEchoResponse:
        response = self.get_echo(GetEchoConfig(echo_id=echo_id, include_segments=include_segments))
        if response is None:
            raise HTTPException(status_code=404, detail="Echo not found")

        return response

    def handle_delete_echo(self, echo_id: str):
        return self.delete_echo(DeleteEchoConfig(echo_id=echo_id))

    def handle_validate_echo(self, echo: Echo) -> ValidateEchoResponse:
        return self.validate_echo(echo)

    def handle_login(self):
        return self.login()

    def handle_scale(self, scale_request: ScaleRequest):
        # Auth token prevents unauthorized scaling
        if scale_request.auth_token != self._loadbalancer_auth_token:
            return None

        if scale_request.service == "recognizer":
            self.recognizer_min_replicas = scale_request.min_replicas
            self.recognizer.ensure_min_replicas(min_replicas=self.recognizer_min_replicas)
        elif scale_request.service == "youtuber":
            self.youtuber_min_replicas = scale_request.min_replicas
            self.youtuber.ensure_min_replicas(min_replicas=self.youtuber_min_replicas)

    def configure_api(self):
        return [
            Post("/api/echoes", method=self.handle_create_echo, timeout=REST_API_TIMEOUT_SECONDS),
            Get("/api/echoes", method=self.handle_list_echoes, timeout=REST_API_TIMEOUT_SECONDS),
            Get("/api/echoes/{echo_id}", method=self.handle_get_echo, timeout=REST_API_TIMEOUT_SECONDS),
            Delete("/api/echoes/{echo_id}", method=self.handle_delete_echo, timeout=REST_API_TIMEOUT_SECONDS),
            Post("/api/validate", method=self.handle_validate_echo, timeout=REST_API_TIMEOUT_SECONDS),
            Get("/api/login", method=self.handle_login, timeout=REST_API_TIMEOUT_SECONDS),
            Post("/api/scale", method=self.handle_scale, timeout=REST_API_TIMEOUT_SECONDS),
        ]

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


analytics_enabled = os.environ.get("ECHO_ANALYTICS_ENABLED", "false").lower() == "true"
root_path = os.environ.get("ECHO_ROOT_PATH", "/")

app = LightningApp(
    EchoApp(),
    log_level=os.environ.get("ECHO_LOG_LEVEL", "INFO"),
    root_path=root_path if root_path != "/" else "",
    info=AppInfo(
        title="Transcription. Simple and open-source.",
        favicon="https://storage.googleapis.com/lightning-echo-prod/favicon.svg",
        # flake8: noqa E501
        description="Echo uses near-human speech recognition to transcribe video and audio files - powered by Lightning and OpenAI's Whisper.",
        image="https://storage.googleapis.com/lightning-echo-prod/echo-preview.png",
        meta_tags=[*app_meta, *(analytics if analytics_enabled else [])],
    ),
)
