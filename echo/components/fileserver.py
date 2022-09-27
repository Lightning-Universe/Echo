import json
import os

from flask import Flask, request
from flask_cors import CORS
from lightning import BuildConfig, LightningWork
from lightning_app.storage import Drive


class FileServer(LightningWork):
    def __init__(self, drive: Drive, base_dir: str = "fileserver", chunk_size=10240, **kwargs):
        """This component uploads, downloads files to your application.

        Arguments:
            drive: The drive can share data inside your application.
            base_dir: The local directory where the data will be stored.
            chunk_size: The quantity of bytes to download/upload at once.
        """
        super().__init__(
            cloud_build_config=BuildConfig(["flask", "flask-cors"]),
            parallel=True,
            **kwargs,
        )

        self.drive = drive
        self.base_dir = base_dir
        self.chunk_size = chunk_size

        os.makedirs(self.base_dir, exist_ok=True)

        self.uploaded_files = dict()

    def run(self):
        flask_app = Flask(__name__)
        CORS(flask_app)

        @flask_app.put("/upload/<echo_id>")
        def upload_file(echo_id: str):
            """Upload a file directly as form data."""
            file = request.files["file"]

            return self.upload_file(echo_id, file)

        flask_app.run(host=self.host, port=self.port, load_dotenv=False)

    def alive(self):
        """Hack: Returns whether the server is alive."""
        return self.url != ""

    def upload_file(self, echo_id: str, file):
        """Upload a file while tracking its progress."""
        meta_file = echo_id + ".meta"
        self.uploaded_files[echo_id] = {"progress": (0, None), "done": False}

        with open(self.get_filepath(echo_id), "wb") as out_file:
            content = file.read(self.chunk_size)
            while content:
                size = out_file.write(content)

                self.uploaded_files[echo_id]["progress"] = (
                    self.uploaded_files[echo_id]["progress"][0] + size,
                    None,
                )
                content = file.read(self.chunk_size)

        full_size = self.uploaded_files[echo_id]["progress"][0]
        self.drive.put(self.get_filepath(echo_id))
        self.uploaded_files[echo_id] = {
            "progress": (full_size, full_size),
            "done": True,
            "uploaded_file": echo_id,
        }

        meta = {
            "original_path": echo_id,
            "display_name": os.path.splitext(echo_id)[0],
            "size": full_size,
            "drive_path": echo_id,
        }
        with open(self.get_filepath(meta_file), "wt") as f:
            json.dump(meta, f)

        self.drive.put(self.get_filepath(meta_file))

        return meta

    def get_filepath(self, path: str) -> str:
        """Returns file path stored on the file server."""
        return os.path.join(self.base_dir, path)
