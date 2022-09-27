import json
import os
from argparse import ArgumentParser
from typing import List
from uuid import uuid4

import requests
from lightning.app.core.constants import APP_SERVER_HOST, APP_SERVER_PORT
from lightning.app.utilities.commands import ClientCommand

from echo.models.echo import DeleteEchoConfig, Echo, GetEchoConfig


class CreateEcho(ClientCommand):
    def run(self):
        parser = ArgumentParser(description="Create an Echo")
        parser.add_argument("--file", type=str, default=None, required=True)

        args = parser.parse_args()

        if not os.path.exists(args.file):
            raise ValueError(f"File does not exist: {args.file}")

        base_url = self.state._state["works"]["fileserver"]["vars"]["_url"]
        if "localhost" in base_url:
            base_url = f"{APP_SERVER_HOST}:{APP_SERVER_PORT}"

        # Upload audio file to fileserver
        with open(args.file, "rb") as f:
            data = f.read()
            echo_id = str(uuid4())

            print(f"Uploading audio file to fileserver: {base_url}/upload/{echo_id}")

            response = requests.put(url=f"{base_url}/upload/{echo_id}", files={"file": data})
            assert response.status_code == 200, f"Failed to upload file: {response.text}"

            print(f"Completed upload of audio file to fileserver: {base_url}/upload/{echo_id}")

        response = self.invoke_handler(config=Echo(id=echo_id, source_file_path=f"fileserver/{echo_id}", text=""))
        print(response)


class ListEchoes(ClientCommand):
    def run(self):
        response: List[Echo] = self.invoke_handler()
        print(json.dumps(response, indent=4))


class GetEcho(ClientCommand):
    def run(self):
        parser = ArgumentParser(description="Get an Echo")
        parser.add_argument("--id", type=str, default=None, required=True)

        args = parser.parse_args()

        response = self.invoke_handler(config=GetEchoConfig(echo_id=args.id))
        print(json.dumps(response, indent=4))


class DeleteEcho(ClientCommand):
    def run(self):
        parser = ArgumentParser(description="Delete an Echo")
        parser.add_argument("--id", type=str, default=None, required=True)

        args = parser.parse_args()

        response = self.invoke_handler(config=DeleteEchoConfig(echo_id=args.id))
        print(json.dumps(response, indent=4))
