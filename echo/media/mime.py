import magic

# iOS does not support the <audio> tag for WebM files
UNSUPPORTED_MEDIA_TYPES = ["video/webm"]


def get_mimetype(filepath):
    return magic.Magic(mime=True).from_file(filepath)
