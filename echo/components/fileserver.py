import json
import os
import subprocess
from dataclasses import dataclass

import magic
import uvicorn
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from lightning import BuildConfig, LightningWork
from lightning_app.storage import Drive
from lightning_app.utilities.app_helpers import Logger

from echo.media.mime import UNSUPPORTED_MEDIA_TYPES, get_mimetype
from echo.monitoring.sentry import init_sentry

logger = Logger(__name__)


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return [
            "sudo apt-get update",
            "sudo apt-get install -y libmagic1 ffmpeg",
            "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
        ]


class FileServer(LightningWork):
    def __init__(self, drive: Drive, base_dir: str = None, chunk_size=10240, **kwargs):
        """This component uploads, downloads files to your application.

        Arguments:
            drive: The drive can share data inside your application.
            base_dir: The local directory where the data will be stored.
            chunk_size: The quantity of bytes to download/upload at once.
        """
        super().__init__(
            cloud_build_config=CustomBuildConfig(requirements=["python-magic"]),
            parallel=True,
            **kwargs,
        )

        init_sentry()

        self.drive = drive
        self.base_dir = base_dir
        self.chunk_size = chunk_size

        os.makedirs(self.base_dir, exist_ok=True)

        self.uploaded_files = dict()

    def run(self):
        app = FastAPI()

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @app.put("/upload/{echo_id}")
        def upload_file(echo_id: str, file: UploadFile):
            """Upload a file directly as form data."""
            return self.upload_file(echo_id, file)

        @app.get("/download/{echo_id}")
        def download_file(echo_id: str):
            """Download a file for a specific Echo."""
            return self.download_file(echo_id)

        uvicorn.run(app, host=self.host, port=self.port, log_level="error")

    def alive(self):
        """Hack: Returns whether the server is alive."""
        return self.url != ""

    def upload_file(self, echo_id: str, file: UploadFile):
        """Upload a file while tracking its progress."""
        self.uploaded_files[echo_id] = {"progress": (0, None), "done": False}

        # Save file to shared Drive
        filepath = self._get_filepath(echo_id)
        with open(filepath, "wb") as out_file:
            content = file.file.read(self.chunk_size)
            while content:
                size = out_file.write(content)
                self.uploaded_files[echo_id]["progress"] = (
                    self.uploaded_files[echo_id]["progress"][0] + size,
                    None,
                )
                content = file.file.read(self.chunk_size)

        if get_mimetype(filepath) in UNSUPPORTED_MEDIA_TYPES:
            # TODO(alecmerdler): Figure out how to use `ffmpeg-python` rather than shelling out...
            # TODO(alecmerdler): Handle exceptions from `ffmpeg`
            subprocess.call(f"ffmpeg -i {filepath} -vn -acodec libmp3lame -y {filepath}.mp3", shell=True)

            assert get_mimetype(f"{filepath}.mp3") == "audio/mpeg"

            os.remove(filepath)
            os.rename(f"{filepath}.mp3", filepath)

        self.drive.put(self._get_drive_filepath(echo_id))
        os.remove(filepath)

        full_size = self.uploaded_files[echo_id]["progress"][0]
        self.uploaded_files[echo_id] = {
            "progress": (full_size, full_size),
            "done": True,
            "uploaded_file": echo_id,
        }

        # Save metadata file to shared Drive
        meta_file = echo_id + ".meta"
        meta = {
            "original_path": echo_id,
            "display_name": os.path.splitext(echo_id)[0],
            "size": full_size,
            "drive_path": echo_id,
        }
        with open(self._get_filepath(meta_file), "wt") as f:
            json.dump(meta, f)

        self.drive.put(self._get_drive_filepath(meta_file))
        os.remove(self._get_filepath(meta_file))

        return meta

    def download_file(self, echo_id: str):
        filepath = self._get_filepath(echo_id)

        if not os.path.exists(filepath):
            self.drive.get(self._get_drive_filepath(echo_id))

        mimetype = magic.Magic(mime=True).from_file(filepath)

        return FileResponse(path=filepath, filename=filepath, media_type=mimetype, headers={"Accept-Ranges": "bytes"})

    def delete_file(self, echo_id: str):
        self.drive.delete(self._get_drive_filepath(echo_id))

    def _get_drive_filepath(self, echo_id: str):
        """Returns file path stored on the shared Drive."""
        # NOTE: Drive throws `SameFileError` when using absolute path in `put()`, so we use relative path.
        directory = self.base_dir.split(os.sep)[-1]

        return os.path.join(directory, echo_id)

    def _get_filepath(self, path: str):
        """Returns file path stored on the file server."""
        return os.path.join(self.base_dir, path)
