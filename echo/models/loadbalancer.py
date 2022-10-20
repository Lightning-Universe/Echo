from pydantic import BaseModel

from echo.models.utils import to_camelcase


class ScaleRequest(BaseModel):
    """Used for the `/api/scale` endpoint."""

    auth_token: str
    service: str
    min_replicas: int

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True
