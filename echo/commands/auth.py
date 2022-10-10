import json
import os

from lightning.app.utilities.commands import ClientCommand

from echo.authn.session import CREDENTIALS_FILENAME


class Login(ClientCommand):
    def run(self):
        os.makedirs(os.path.dirname(CREDENTIALS_FILENAME), exist_ok=True)

        if os.path.exists(CREDENTIALS_FILENAME):
            with open(CREDENTIALS_FILENAME) as f:
                credentials = json.load(f)
                if "userID" in credentials:
                    print(f"Already logged in as user: {credentials['userID']}")
                    return

        response = self.invoke_handler()
        with open(CREDENTIALS_FILENAME, "w+") as f:
            f.write(json.dumps({"userID": response["userId"]}))

        print(f"You are logged in to Echo! User ID: {response['userId']}")
