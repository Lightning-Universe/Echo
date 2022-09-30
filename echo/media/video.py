import ffmpeg


def contains_audio(video_file_path) -> bool:
    """Uses `ffprobe` to determine if a given video file contains an audio stream."""
    probe = ffmpeg.probe(video_file_path)

    return any(stream["codec_type"] == "audio" for stream in probe["streams"])
