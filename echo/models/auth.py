from pydantic import BaseModel

from echo.models.utils import to_camelcase


class LoginResponse(BaseModel):
    """Used for the `login` command."""

    user_id: str

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True
