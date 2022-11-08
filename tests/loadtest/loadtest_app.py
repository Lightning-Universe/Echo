import os
from datetime import datetime
from typing import List
from uuid import uuid4

import requests
from lightning import LightningApp, LightningFlow

WORKER_SCHEDULE = "*/1 * * * *"
SCALE_FACTOR = 1
USER_ECHOES_LIMIT = 3

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
    ("L2.0 A Brief History", "https://www.youtube.com/watch?v=Ezig00nypvU"),
    ("L1.0 Intro to Deep Learning", "https://www.youtube.com/watch?v=1nqCZqDYPp0"),
]


class LoadTestApp(LightningFlow):
    def __init__(self):
        super().__init__()

        self.app_url = os.environ.get("ECHO_APP_URL")
        self.user_id_prefix = "loadtest-alecmerdler"
        self.users: List[str] = []

    def create_echo(self, youtube_url: str, display_name: str):
        user_id = f"{self.user_id_prefix}-{uuid4()}"
        self.users.append(user_id)

        echo_id = str(uuid4())

        echo = {
            "id": echo_id,
            "userId": user_id,
            "displayName": display_name,
            "sourceFilePath": f"fileserver/{echo_id}",
            "sourceYoutubeUrl": youtube_url,
            "mediaType": "video/mp4",
            "text": "",
        }

        print(f"Creating Echo {echo_id} ({display_name}) for {youtube_url}")

        session = requests.Session()
        resp = session.post(f"{self.app_url}/api/echoes", json=echo)
        if resp.status_code != 200:
            print(f"Failed to create echo: {resp.text}")

        print(f"Finished creating Echo {echo_id} for {youtube_url}")

    def list_echoes(self):
        completed_stats = []
        pending_stats = []

        # Collect statistics
        for user_id in self.users:
            session = requests.Session()
            resp = session.get(f"{self.app_url}/api/echoes", params={"user_id": user_id}).json()

            completed = [echo for echo in resp if echo["completedTranscriptionAt"] is not None]
            for echo in completed:
                duration = datetime.fromisoformat(echo["completedTranscriptionAt"]) - datetime.fromisoformat(
                    echo["createdAt"]
                )
                completed_stats.append({"id": echo["id"], "processedFor": str(duration)})

            pending = [echo for echo in resp if echo["completedTranscriptionAt"] is None]
            for echo in pending:
                duration = datetime.now() - datetime.fromisoformat(echo["createdAt"])
                pending_stats.append({"id": echo["id"], "processingFor": str(duration)})

        # Print statistics
        print(f"Completed Echoes: {len(completed_stats)}")
        for echo in completed_stats:
            print(f"  {echo['id']} - {echo['processedFor']}")

        print(f"Pending Echoes: {len(pending_stats)}")
        for echo in pending_stats:
            print(f"  {echo['id']} - {echo['processingFor']}")

    def run(self):
        if self.schedule(WORKER_SCHEDULE):
            for display_name, youtube_url in videos * SCALE_FACTOR:
                self.create_echo(youtube_url, display_name)

        if self.schedule(WORKER_SCHEDULE):
            self.list_echoes()


app = LightningApp(LoadTestApp())
