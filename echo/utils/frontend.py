from pathlib import Path
from urllib.request import urlretrieve

urls = [
    "https://storage.googleapis.com/lightning-echo-prod/build/asset-manifest.json",
    "https://storage.googleapis.com/lightning-echo-prod/build/favicon.svg",
    "https://storage.googleapis.com/lightning-echo-prod/build/index.html",
    "https://storage.googleapis.com/lightning-echo-prod/build/manifest.json",
    "https://storage.googleapis.com/lightning-echo-prod/build/robots.txt",
]


def download_frontend_build(destination: Path):
    for url in urls:
        file = Path(url.split("/")[-1])
        urlretrieve(url, destination / file)
