from typing import List, Optional, Type

import requests
from requests import Session
from requests.adapters import HTTPAdapter
from sqlmodel import SQLModel
from urllib3.util.retry import Retry

from echo.models.echo import Echo
from echo.models.general import GeneralModel
from echo.models.segment import Segment

_CONNECTION_RETRY_TOTAL = 5
_CONNECTION_RETRY_BACKOFF_FACTOR = 1


def _configure_session() -> Session:
    """Configures the session for GET and POST requests.

    It enables a generous retrial strategy that waits for the application server to connect.
    """
    retry_strategy = Retry(
        # wait time between retries increases exponentially according to: backoff_factor * (2 ** (retry - 1))
        total=_CONNECTION_RETRY_TOTAL,
        backoff_factor=_CONNECTION_RETRY_BACKOFF_FACTOR,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    http = requests.Session()
    http.mount("https://", adapter)
    http.mount("http://", adapter)
    return http


class DatabaseClient:
    def __init__(self, model: Type[SQLModel] = None, db_url: str = None):
        if model is None:
            raise ValueError("model must be provided")
        if db_url is None:
            raise ValueError("db_url must be provided")

        self.model = model
        self.db_url = db_url
        self.general_endpoint = db_url + "/general/"
        self.session = _configure_session()

    def list_echoes_for_user(self, user_id: str) -> List[Echo]:
        resp = self.session.get(f"{self.db_url}/echoes/?user_id={user_id}")
        assert resp.status_code == 200
        return [self.model(**data) for data in resp.json()]

    def get_echo(self, echo_id: str) -> Optional[Echo]:
        resp = self.session.get(f"{self.db_url}/echoes/{echo_id}")
        assert resp.status_code == 200
        obj = resp.json()
        return self.model(**obj) if obj else None

    def list_segments_for_echo(self, echo_id: str) -> List[Segment]:
        resp = self.session.get(f"{self.db_url}/segments/?echo_id={echo_id}")
        assert resp.status_code == 200
        return [self.model(**data) for data in resp.json()]

    def delete_echo(self, echo_id: str) -> None:
        resp = self.session.delete(f"{self.db_url}/echoes/{echo_id}")
        assert resp.status_code == 200
        return None

    def delete_segments_for_echo(self, echo_id: str) -> None:
        resp = self.session.delete(f"{self.db_url}/segments/?echo_id={echo_id}")
        assert resp.status_code == 200
        return None

    def post(self, config: SQLModel):
        resp = self.session.post(
            self.general_endpoint,
            data=GeneralModel.from_obj(config).json(),
        )
        assert resp.status_code == 200

    def put(self, config: SQLModel):
        resp = self.session.put(
            self.general_endpoint,
            data=GeneralModel.from_obj(config).json(),
        )
        assert resp.status_code == 200
