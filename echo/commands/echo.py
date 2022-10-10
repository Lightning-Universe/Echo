import json
import mimetypes
import os
from argparse import ArgumentParser
from typing import List
from uuid import uuid4

import requests
from lightning.app.core.constants import APP_SERVER_HOST, APP_SERVER_PORT
from lightning.app.utilities.commands import ClientCommand

from echo.authn.session import CREDENTIALS_FILENAME
from echo.models.echo import DeleteEchoConfig, Echo, GetEchoConfig, ListEchoesConfig

SUPPORTED_AUDIO_MEDIA_TYPES = [
    "audio/wav",
    "audio/x-wav",
    "audio/mp3",
    "audio/m4a",
    "audio/ogg",
    "audio/flac",
    "audio/mpeg",
]
SUPPORTED_VIDEO_MEDIA_TYPES = ["video/mp4"]


class CreateEcho(ClientCommand):
    def _upload_file(self, file: str, echo_id: str):
        if not os.path.exists(file):
            raise ValueError(f"File does not exist: {file}")

        base_url = self.state._state["works"]["fileserver"]["vars"]["_url"]
        if "localhost" in base_url:
            base_url = f"{APP_SERVER_HOST}:{APP_SERVER_PORT}"

        # Upload audio file to fileserver
        with open(file, "rb") as f:
            data = f.read()

            print(f"Uploading audio file to fileserver: {base_url}/upload/{echo_id}")

            response = requests.put(url=f"{base_url}/upload/{echo_id}", files={"file": data})
            assert response.status_code == 200, f"Failed to upload file: {response.text}"

            print(f"Completed upload of audio file to fileserver: {base_url}/upload/{echo_id}")

    def run(self):
        parser = ArgumentParser(description="Create an Echo")
        parser.add_argument("--file", type=str, default=None, required=False)
        parser.add_argument("--youtube-url", type=str, default=None, required=False)
        parser.add_argument("--display-name", type=str, default=None, required=True)

        args = parser.parse_args()

        if args.file is None and args.youtube_url is None:
            raise ValueError("Either --file or --youtube-url must be specified!")

        user_id = get_user_id()
        echo_id = str(uuid4())

        if args.file is not None:
            media_type = mimetypes.guess_type(args.file)[0]
            if media_type not in SUPPORTED_AUDIO_MEDIA_TYPES and media_type not in SUPPORTED_VIDEO_MEDIA_TYPES:
                raise ValueError(f"Unsupported media type: {media_type}")

            self._upload_file(args.file, echo_id)

            response = self.invoke_handler(
                config=Echo(
                    user_id=user_id,
                    id=echo_id,
                    display_name=args.display_name,
                    source_file_path=f"fileserver/{echo_id}",
                    source_youtube_url=None,
                    media_type=media_type,
                )
            )
            print(response)

        elif args.youtube_url is not None:
            # FIXME(alecmerdler): Validate `args.youtube_url`...
            response = self.invoke_handler(
                config=Echo(
                    user_id=user_id,
                    id=echo_id,
                    display_name=args.display_name,
                    source_file_path=f"fileserver/{echo_id}",
                    source_youtube_url=args.youtube_url,
                    media_type="video/mp4",
                )
            )
            print(response)


class ListEchoes(ClientCommand):
    def run(self):
        user_id = get_user_id()

        response: List[Echo] = self.invoke_handler(config=ListEchoesConfig(user_id=user_id))
        print(json.dumps(response, indent=4))


class GetEcho(ClientCommand):
    def run(self):
        parser = ArgumentParser(description="Get an Echo")
        parser.add_argument("--id", type=str, default=None, required=True)
        parser.add_argument("--include-segments", type=bool, default=False, required=False)

        args = parser.parse_args()

        user_id = get_user_id()

        response = self.invoke_handler(
            config=GetEchoConfig(user_id=user_id, echo_id=args.id, include_segments=args.include_segments)
        )
        print(json.dumps(response, indent=4))


class DeleteEcho(ClientCommand):
    def run(self):
        parser = ArgumentParser(description="Delete an Echo")
        parser.add_argument("--id", type=str, default=None, required=True)

        args = parser.parse_args()

        user_id = get_user_id()

        response = self.invoke_handler(config=DeleteEchoConfig(user_id=user_id, echo_id=args.id))
        print(json.dumps(response, indent=4))


def get_user_id() -> str:
    with open(CREDENTIALS_FILENAME) as f:
        credentials = json.load(f)
        if "userID" not in credentials:
            raise ValueError("Not logged in! Run `lightning login` before running this command!")

        return credentials["userID"]
