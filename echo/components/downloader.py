import os
import pathlib
import tempfile

import requests
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.utilities.app_helpers import Logger
from youtube_dl import YoutubeDL

from echo.monitoring.sentry import init_sentry

logger = Logger(__name__)


DUMMY_ECHO_ID = "dummy"
DUMMY_YOUTUBE_URL = "dummy"
DEFAULT_CLOUD_COMPUTE = "cpu"


class Downloader(LightningWork):
    """Handles downloading and extracting videos from the internet."""

    def __init__(self, cloud_compute=DEFAULT_CLOUD_COMPUTE, base_dir: str = None):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute(cloud_compute),
            cloud_build_config=BuildConfig(requirements=["youtube_dl"]),
        )

        init_sentry()

        self.base_dir = base_dir

        # FIXME(alecmerdler): Trying to figure out how to wait until the download is complete...
        self.download_complete = False

    def run(self, source_url: str, echo_id: str, fileserver_url: str):
        """Download a source from the internet and saves it to the shared Drive."""
        # NOTE: Dummy Echo is used to spin up the cloud machine on app startup so subsequent requests are faster
        if source_url == DUMMY_YOUTUBE_URL and echo_id == DUMMY_ECHO_ID:
            logger.info("Skipping dummy Echo")
            return

        if not source_url:
            raise ValueError("No YouTube URL provided.")

        if not echo_id:
            raise ValueError("No Echo ID provided.")

        if not fileserver_url:
            raise ValueError("No Fileserver URL provided.")

        # Create a temporary file to store the downlaoded video
        download_file = tempfile.NamedTemporaryFile(suffix=".mp4")
        download_path = pathlib.Path(download_file.name)

        def on_complete(d):
            if d["status"] == "finished":
                logger.info("Download complete")

                # Upload video to fileserver where it will be added to the shared Drive
                requests.put(f"{fileserver_url}/upload/{echo_id}", files={"file": open(download_file.name, "rb")})
                os.remove(download_file.name)

        ydl_opts = {
            "format": "worst[ext=mp4]",
            "outtmpl": str(download_path),
            # TODO(alecmerdler): We could use progress callback to update the database with the download progress...
            "progress_hooks": [on_complete],
            "continuedl": False,
            "cachedir": False,
        }

        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([source_url])
