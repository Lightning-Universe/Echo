import magic

# iOS does not support playback of `.webm` files
UNSUPPORTED_MEDIA_TYPES = ["video/webm", "audio/webm"]


def get_mimetype(filepath):
    return magic.Magic(mime=True).from_file(filepath)
