from typing import List

import ffmpeg
from youtube_dl import YoutubeDL
from youtube_dl.extractor import gen_extractors
from youtube_dl.extractor.common import InfoExtractor


def contains_audio(video_file_path) -> bool:
    """Uses `ffprobe` to determine if a given video file contains an audio stream."""
    probe = ffmpeg.probe(video_file_path)

    return any(stream["codec_type"] == "audio" for stream in probe["streams"])


def is_valid_youtube_url(youtube_url: str) -> bool:
    """Returns whether or not a given string is a valid YouTube URL."""
    extractors: List[InfoExtractor] = gen_extractors()
    for e in extractors:
        if e.suitable(youtube_url) and "youtube" in e.IE_NAME:
            return True

    return False


def youtube_video_length(youtube_url: str):
    """Returns the length of a YouTube video."""
    ydl_opts = {
        "format": "worst[ext=mp4]",
    }

    with YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(youtube_url, download=False)

        return info_dict["duration"]
