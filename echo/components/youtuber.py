import os
from dataclasses import dataclass

from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.storage import Drive
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

    def __init__(self, drive: Drive, cloud_compute=DEFAULT_CLOUD_COMPUTE, base_dir: str = None):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute(DEFAULT_CLOUD_COMPUTE),
            cloud_build_config=CustomBuildConfig(requirements=["pytube"]),
        )

        init_sentry()

        self.drive = drive
        self.base_dir = base_dir

    def run(self, youtube_url: str, echo_id: str):
        """Download a YouTube video and save it to the shared Drive."""
        if not youtube_url:
            raise ValueError("No YouTube URL provided.")

        if not echo_id:
            raise ValueError("No Echo ID provided.")

        # NOTE: Dummy Echo is used to spin up the cloud machine on app startup so subsequent requests are faster
        if youtube_url == DUMMY_YOUTUBE_URL and echo_id == DUMMY_ECHO_ID:
            logger.info("Skipping dummy Echo")
            return

        YouTube(youtube_url).streams.filter(progressive=True, file_extension="mp4").order_by(
            "resolution"
        ).asc().first().download(output_path=self.base_dir, filename=echo_id)

        self.drive.put(self._get_drive_filepath(echo_id))

        os.remove(os.path.join(self.base_dir, echo_id))

    def _get_drive_filepath(self, echo_id: str):
        """Returns file path stored on the shared Drive."""
        # NOTE: Drive throws `SameFileError` when using absolute path in `put()`, so we use relative path.
        directory = self.base_dir.split(os.sep)[-1]

        return os.path.join(directory, echo_id)
