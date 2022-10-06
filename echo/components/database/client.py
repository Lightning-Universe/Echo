from typing import Optional, Type

import requests
from requests import Session
from requests.adapters import HTTPAdapter
from sqlmodel import SQLModel
from urllib3.util.retry import Retry

from echo.models.general import GeneralModel

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
        self.db_url = db_url + "/general/"
        self.session = _configure_session()

    def get(self, config: Optional[Type[SQLModel]] = None):
        cls = config if config else self.model
        resp = self.session.get(self.db_url, data=GeneralModel.from_cls(cls).json())
        assert resp.status_code == 200
        return [cls(**data) for data in resp.json()]

    def post(self, config: SQLModel):
        resp = self.session.post(
            self.db_url,
            data=GeneralModel.from_obj(config).json(),
        )
        assert resp.status_code == 200

    def put(self, config: SQLModel):
        resp = self.session.put(
            self.db_url,
            data=GeneralModel.from_obj(config).json(),
        )
        assert resp.status_code == 200

    def delete(self, config: SQLModel):
        resp = self.session.delete(
            self.db_url,
            data=GeneralModel.from_obj(config).json(),
        )
        assert resp.status_code == 200
