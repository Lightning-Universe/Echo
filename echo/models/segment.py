from sqlmodel import Field, SQLModel

from echo.models.utils import to_camelcase


class Segment(SQLModel, table=True):
    """Represents a segment of an audio/video file."""

    id: str = Field(primary_key=True)
    seek: int
    start: float
    end: float
    text: str
    echo_id: int = Field(default=None, foreign_key="echo.id")

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True
