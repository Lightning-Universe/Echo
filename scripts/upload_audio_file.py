import requests
from requests.adapters import HTTPAdapter

FILEPATH = "/home/alec/work/Lightning-AI/LAI-Echo-App/tests/data/mkbhd.mp3"

if __name__ == "__main__":
    file = open(FILEPATH, "rb")
    url = "https://jqgqf-01ge35qct4mnsr4an5dwmx67cb.litng-ai-03.litng.ai/upload/1234"

    with open(FILEPATH, "rb") as f:
        data = f.read()

        with requests.Session() as s:
            s.mount("https://", HTTPAdapter(max_retries=3))

            response = s.put(url, files={"file": data})
            assert response.status_code == 200, f"Failed to upload file: {response.text}"
