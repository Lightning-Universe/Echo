import os
import uuid

import requests
from lightning import LightningApp, LightningFlow
from lightning_app.runners import MultiProcessRuntime
from lightning_app.storage import Drive

from echo.components.fileserver import FileServer


class FileServerTestApp(LightningFlow):
    def __init__(self):
        super().__init__()
        self.drive = Drive("lit://test")
        self.fileserver = FileServer(base_dir=os.path.join(os.path.dirname(__file__), "fileserver"), drive=self.drive)

    def run(self):
        self.fileserver.run()

        if self.fileserver.alive():
            echo_id = uuid.uuid4()
            upload_url = f"{self.fileserver.url}/upload/{echo_id}"
            download_url = f"{self.fileserver.url}/download/{echo_id}"

            with open("test.txt", "w") as f:
                f.write("Some text.")

                # FIXME(alecmerdler): FileServer is responding with `HTTP 404` for some reason...
                response = requests.put(upload_url, files={"file": open("test.txt", "rb")})
                assert response.status_code == 200

                response = requests.get(download_url)
                assert response.status_code == 200

            self._exit()


def test_fileserver():
    app = LightningApp(FileServerTestApp())
    MultiProcessRuntime(app).dispatch()
