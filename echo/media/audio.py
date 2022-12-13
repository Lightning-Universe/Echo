import math

import ffmpeg


def audio_length(audio_file_path: str) -> int:
    """Uses `ffprobe` to determine the length of the audio file in seconds."""
    probe = ffmpeg.probe(audio_file_path)

    return math.ceil(float(probe["format"]["duration"]))
