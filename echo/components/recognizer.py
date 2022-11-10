import os
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime
from typing import List

import pysrt
from lightning import BuildConfig, CloudCompute, LightningWork
from lightning.app.storage import Drive
from lightning.app.utilities.app_helpers import Logger

from echo.components.database.client import DatabaseClient
from echo.media.video import contains_audio
from echo.models.echo import Echo, Segment
from echo.monitoring.sentry import init_sentry

DEFAULT_MODEL_SIZE = "tiny"
DEFAULT_CLOUD_COMPUTE = "cpu-small"
DRIVE_SOURCE_FILE_TIMEOUT_SECONDS = 18000
DUMMY_ECHO_ID = "dummy"

logger = Logger(__name__)


@dataclass
class CustomBuildConfig(BuildConfig):
    model_size: str = DEFAULT_MODEL_SIZE

    def build_commands(self):
        return [
            "sudo apt-get update",
            "sudo apt-get install -y ffmpeg libmagic1",
            "git clone https://github.com/ggerganov/whisper.cpp.git",
            f"cd whisper.cpp && make {self.model_size}",
        ]


class SpeechRecognizer(LightningWork):
    def __init__(
        self,
        model_size=DEFAULT_MODEL_SIZE,
        cloud_compute=DEFAULT_CLOUD_COMPUTE,
        drive: Drive = None,
    ):
        super().__init__(
            parallel=True,
            cloud_compute=CloudCompute(cloud_compute),
            cloud_build_config=CustomBuildConfig(requirements=[], model_size=model_size),
        )

        init_sentry()

        # NOTE: Private attributes don't need to be serializable, so we use them to store complex objects
        self._drive = drive

        self.whisper_home = os.environ.get("ECHO_WHISPER_CPP_HOME", "$HOME/whisper.cpp")
        self.model_size = model_size

    def recognize(self, audio_file_path: str):
        assert os.path.exists(audio_file_path), f"File does not exist: {audio_file_path}"

        output_txt = f"{audio_file_path}.txt"
        output_srt = f"{audio_file_path}.srt"

        commands = [
            f"{self.whisper_home}/main",
            f"-m {self.whisper_home}/models/ggml-{self.model_size}.bin",
            audio_file_path,
            "-pc",
            "--output-txt",
            "--output-srt",
        ]

        # TODO: Use Python bindings to `whisper.cpp` when they are officially released
        subprocess.call(" ".join(commands), shell=True)

        result = {"text": "", "segments": []}
        with open(output_txt) as f:
            result["text"] = f.read()

        subs = pysrt.open(output_srt)
        for index, sub in enumerate(subs):
            result["segments"].append(
                {
                    "id": index,
                    "text": sub.text,
                    "seek": sub.start.ordinal,
                    "start": int(sub.start.ordinal / 1000),
                    "end": int(sub.end.ordinal / 1000),
                }
            )

        return result

    def convert_to_audio(self, source_file_path: str):
        if not contains_audio(source_file_path):
            raise ValueError(f"Source does not contain an audio stream: {source_file_path}")

        wav_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        # TODO: Handle exceptions from `ffmpeg`
        subprocess.call(f"ffmpeg -i {source_file_path} -y -ar 16000 -ac 1 -c:a pcm_s16le {wav_file.name}", shell=True)

        return wav_file.name

    def run(self, echo: Echo, db_url: str):
        """Runs speech recognition and returns the text for a given Echo."""
        # NOTE: Dummy Echo is used to spin up the cloud machine on app startup so subsequent requests are faster
        if echo.id == DUMMY_ECHO_ID:
            logger.info("Skipping dummy Echo")
            return

        logger.info("Initializing database client")
        echo_db_client = DatabaseClient(model=Echo, db_url=db_url)
        segment_db_client = DatabaseClient(model=Segment, db_url=db_url)

        logger.info(f"Recognizing speech from: {echo.id}")

        audio_file_path = echo.source_file_path
        self._drive.get(echo.source_file_path, timeout=DRIVE_SOURCE_FILE_TIMEOUT_SECONDS)

        audio_file_path = self.convert_to_audio(echo.source_file_path)

        # Run the speech recognition model and save the result
        result = self.recognize(audio_file_path)

        echo.completed_transcription_at = datetime.now()
        echo.text = result["text"]
        echo_db_client.put(echo)

        segments: List[Segment] = []
        for segment in result["segments"]:
            segments.append(
                Segment(
                    id=f"{echo.id}-{segment['id']}",
                    echo_id=echo.id,
                    text=segment["text"],
                    seek=segment["seek"],
                    start=segment["start"],
                    end=segment["end"],
                )
            )

        segment_db_client.create_segments_for_echo(segments)

        logger.info(f"Finished recognizing speech from: {echo.id}")

        os.remove(audio_file_path)
