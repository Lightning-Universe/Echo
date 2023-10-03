import ffmpeg
from pytube import YouTube


def contains_audio(video_file_path: str) -> bool:
    """Uses `ffprobe` to determine if a given video file contains an audio stream."""
    probe = ffmpeg.probe(video_file_path)

    return any(stream["codec_type"] == "audio" for stream in probe["streams"])


def is_valid_youtube_url(youtube_url: str) -> bool:
    """Returns whether or not a given string is a valid YouTube URL."""
    try:
        YouTube(youtube_url)
        return True
    except Exception:
        return False


def youtube_video_length(youtube_url: str):
    """Returns the length of a YouTube video in seconds."""
    return YouTube(youtube_url).length
