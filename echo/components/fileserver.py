import json
import os
import subprocess
from dataclasses import dataclass

import magic
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.storage import Drive
from lightning.app.utilities.app_helpers import Logger

from echo.media.mime import UNSUPPORTED_MEDIA_TYPES, get_mimetype
from echo.monitoring.sentry import init_sentry
from echo.utils.dependencies import RUST_INSTALL_SCRIPT

logger = Logger(__name__)


DEFAULT_CLOUD_COMPUTE = "cpu-small"
DEFAULT_CHUNK_SIZE = 10240


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return [
            "sudo apt-get update",
            "sudo apt-get install -y libmagic1 ffmpeg",
            RUST_INSTALL_SCRIPT,
        ]


class FileServer(LightningWork):
    def __init__(
        self,
        drive: Drive,
        cloud_compute=DEFAULT_CLOUD_COMPUTE,
        base_dir: str = None,
        auth_token: str = None,
    ):
        """This component handles uploading and downloading of the media files that are turned into Echoes."""
        super().__init__(
            cloud_compute=CloudCompute(cloud_compute),
            cloud_build_config=CustomBuildConfig(requirements=["python-magic"]),
            parallel=True,
        )

        init_sentry()

        self.drive = drive
        self.base_dir = base_dir
        self.chunk_size = DEFAULT_CHUNK_SIZE

        # Pre-shared secret that prevents unauthorized deletion of files
        self._auth_token = auth_token

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

        @app.post("/delete/{echo_id}")
        def delete_file(echo_id: str, auth_token: str):
            return self.delete_file(echo_id, auth_token)

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
            # TODO: Handle exceptions from `ffmpeg`
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
            try:
                self.drive.get(self._get_drive_filepath(echo_id))
            except Exception:
                raise HTTPException(status_code=404, detail="File not found")

        mimetype = magic.Magic(mime=True).from_file(filepath)

        return FileResponse(path=filepath, filename=filepath, media_type=mimetype, headers={"Accept-Ranges": "bytes"})

    def delete_file(self, echo_id: str, auth_token: str):
        if auth_token != self._auth_token:
            raise HTTPException(status_code=401, detail="Unauthorized")

        try:
            # FIXME: There is a bug with `Drive.delete()` which does not work in the cloud
            self.drive.delete(self._get_drive_filepath(echo_id))
            self.drive.delete(self._get_drive_filepath(echo_id + ".meta"))
        except Exception:
            logger.warn(f"Could not delete file {echo_id} from Drive")

    def _get_drive_filepath(self, echo_id: str):
        """Returns file path stored on the shared Drive."""
        directory = self.base_dir.split(os.sep)[-1]

        return os.path.join(directory, echo_id)

    def _get_filepath(self, path: str):
        """Returns file path stored on the file server."""
        return os.path.join(self.base_dir, path)
