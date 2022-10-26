import os
from uuid import uuid4

import requests
from lightning import LightningApp, LightningFlow

WORKER_SCHEDULE = "*/1 * * * *"
SCALE_FACTOR = 1

# NOTE: All videos are <5 minutes long
videos = [
    ("Build an Intelligent App In Weeks, Not Months | Lightning AI", "https://www.youtube.com/watch?v=CWfmJlkfST4"),
    ("Watch NVIDIA's AI Teach This Human To Run! 🏃‍♂️", "https://www.youtube.com/watch?v=wqvAconYgK0"),
    ("Lightning AI: Build end-to-end ML systems with plain python", "https://www.youtube.com/watch?v=vFwHl7W5ooE"),
    ("Adobe's New AI: Next Level Cat Videos! 🐈", "https://www.youtube.com/watch?v=qtOkktTNs-k"),
    ("New AI Makes You Play Table Tennis…In a Virtual World! 🏓", "https://www.youtube.com/watch?v=mFnGBz_rPfU"),
    ("Microsoft's AI Understands Humans…But It Had Never Seen One! 👩‍💼", "https://www.youtube.com/watch?v=wXaVokqhHDk"),
    ("L15.3 Different Types of Sequence Modeling Tasks", "https://www.youtube.com/watch?v=Ed8GTvkzkZE"),
    ("L10.3 Early Stopping", "https://www.youtube.com/watch?v=YA1OdkiHJBY"),
    ("L2.0 A Brief History of Deep Learning -- Lecture Overview", "https://www.youtube.com/watch?v=Ezig00nypvU"),
    ("L1.0 Intro to Deep Learning, Course Introduction", "https://www.youtube.com/watch?v=1nqCZqDYPp0"),
]


class LoadTestApp(LightningFlow):
    def __init__(self):
        super().__init__()

        self.app_url = os.environ.get("ECHO_APP_URL")
        self.user_id = "loadtest-alecmerdler"

    def create_echo(self, youtube_url: str, display_name: str):
        echo_id = str(uuid4())

        echo = {
            "id": echo_id,
            "userId": self.user_id,
            "displayName": display_name,
            "sourceFilePath": f"fileserver/{echo_id}",
            "sourceYoutubeUrl": youtube_url,
            "mediaType": "video/mp4",
            "text": "",
        }

        print(f"Creating Echo {echo_id} for {youtube_url}")

        session = requests.Session()
        session.post(f"{self.app_url}/api/echoes", json=echo)

        print(f"Finished creating Echo {echo_id} for {youtube_url}")

    def list_echoes(self):
        session = requests.Session()
        resp = session.get(f"{self.app_url}/api/echoes", params={"user_id": self.user_id}).json()

        completed = [echo for echo in resp if echo["text"] != ""]
        pending = [echo for echo in resp if echo["text"] == ""]

        print(f"Completed: {len(completed)}")
        print(f"Pending: {len(pending)}")

    def run(self):
        if self.schedule(WORKER_SCHEDULE):
            for display_name, youtube_url in videos * SCALE_FACTOR:
                self.create_echo(youtube_url, display_name)

        if self.schedule(WORKER_SCHEDULE):
            self.list_echoes()


app = LightningApp(LoadTestApp())
