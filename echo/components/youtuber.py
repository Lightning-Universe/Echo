import pathlib
import tempfile
from dataclasses import dataclass

import requests
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.utilities.app_helpers import Logger
from pytube import YouTube

from echo.monitoring.sentry import init_sentry
from echo.utils.dependencies import RUST_INSTALL_SCRIPT

logger = Logger(__name__)


DUMMY_ECHO_ID = "dummy"
DUMMY_YOUTUBE_URL = "dummy"
DEFAULT_CLOUD_COMPUTE = "cpu"


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return ["sudo apt-get update", RUST_INSTALL_SCRIPT]


class YouTuber(LightningWork):
    """Handles downloading and extracting videos from YouTube."""

    def __init__(self, cloud_compute=DEFAULT_CLOUD_COMPUTE, base_dir: str = None):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute(cloud_compute),
            cloud_build_config=CustomBuildConfig(requirements=["pytube"]),
        )

        init_sentry()

        self.base_dir = base_dir

    def run(self, youtube_url: str, echo_id: str, fileserver_url: str):
        """Download a YouTube video and save it to the shared Drive."""
        # NOTE: Dummy Echo is used to spin up the cloud machine on app startup so subsequent requests are faster
        if youtube_url == DUMMY_YOUTUBE_URL and echo_id == DUMMY_ECHO_ID:
            logger.info("Skipping dummy Echo")
            return

        if not youtube_url:
            raise ValueError("No YouTube URL provided.")

        if not echo_id:
            raise ValueError("No Echo ID provided.")

        if not fileserver_url:
            raise ValueError("No Fileserver URL provided.")

        # Create a temporary file to store the downlaoded video
        download_file = tempfile.NamedTemporaryFile(suffix=".mp4")
        download_path = pathlib.Path(download_file.name)

        # Download video
        YouTube(youtube_url).streams.filter(progressive=True, file_extension="mp4").order_by(
            "resolution"
        ).asc().first().download(output_path=download_path.parent.absolute(), filename=download_path.name)

        # Upload video to fileserver where it will be added to the shared Drive
        requests.put(f"{fileserver_url}/upload/{echo_id}", files={"file": open(download_file.name, "rb")})
