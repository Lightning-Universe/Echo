import os
import time
from pathlib import Path
from urllib.request import urlretrieve

DEFAULT_BUCKET_URL = "https://storage.googleapis.com/lightning-echo-frontend"

paths = [
    "build/asset-manifest.json",
    "build/favicon.svg",
    "build/index.html",
    "build/manifest.json",
    "build/robots.txt",
]


def download_frontend_build(destination: Path):
    bucket_url = os.environ.get("ECHO_FRONTEND_BUCKET_URL", DEFAULT_BUCKET_URL)
    cache_buster = round(time.time() * 1000)

    for filepath in paths:
        filename = Path(filepath.split("/")[-1])
        urlretrieve(f"{bucket_url}/{filepath}?cacheBuster={cache_buster}", destination / filename)
