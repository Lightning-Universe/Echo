import os
import time
from dataclasses import dataclass

import torch
import whisper
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning_app.storage import Drive

from echo.components.database.client import DatabaseClient
from echo.models.echo import Echo


@dataclass
class CustomBuildConfig(BuildConfig):
    def build_commands(self):
        return ["sudo apt-get update", "sudo apt-get install -y ffmpeg"]


class SpeechRecognizer(LightningWork):
    def __init__(
        self,
        model_size="base",
        drive: Drive = None,
    ):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute("gpu"),
            cloud_build_config=CustomBuildConfig(
                requirements=[
                    "torch",
                    "whisper@ git+https://github.com/openai/whisper",
                ]
            ),
        )

        # NOTE: Private attributes don't need to be serializable, so we use them to store complex objects
        self._drive = drive
        self._model = None
        # FIXME(alecmerdler): Getting `unexpected keyword argument db_client` when trying to pass this as an argument...
        self._db_client: DatabaseClient = None

        self.model_size = model_size
        self.last_called_timestamp = 0
        self.idle = False

    def recognize(self, audio_file_path: str):
        assert os.path.exists(audio_file_path), f"File does not exist: {audio_file_path}"

        # Load audio and pad/trim it to fit 30 seconds
        audio = whisper.load_audio(audio_file_path)
        audio = whisper.pad_or_trim(audio)

        # Make log-Mel spectrogram and move to the same device as the model
        mel = whisper.log_mel_spectrogram(audio).to(self._model.device)

        # Detect the spoken language
        _, probs = self._model.detect_language(mel)
        print(f"Detected language: {max(probs, key=probs.get)}")

        # Define options for the recognizer
        if torch.cuda.is_available():
            options = whisper.DecodingOptions(task="translate")
        else:
            options = whisper.DecodingOptions(task="translate", fp16=False)

        # Decode the audio
        return whisper.decode(self._model, mel, options)

    # TODO(alecmerdler): Do load testing to see how many Echos can be processed at once...
    def run(self, echo: Echo, db_url: str):
        self.idle = False
        self.last_called_timestamp = time.time()

        # Load model lazily at runtime, rather than in `__init__()`
        if self._model is None:
            self._model = whisper.load_model(self.model_size)

        if self._db_client is None:
            print("Initializing database client")
            self._db_client = DatabaseClient(model=Echo, db_url=db_url)

        print(f"Recognizing speech from: {echo.id}")

        self._drive.get(echo.source_file_path)

        result = self.recognize(echo.source_file_path)
        echo.text = result.text
        self._db_client.put(echo)

        print(f"Finished recognizing speech from: {echo.id}")

        self.idle = True
