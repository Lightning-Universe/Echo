from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel

from echo.models.segment import Segment
from echo.models.utils import to_camelcase


class Echo(SQLModel, table=True):
    """Represents an audio file that can be transcribed."""

    id: str = Field(primary_key=True)
    display_name: Optional[str] = None
    source_file_path: str
    source_youtube_url: Optional[str] = None
    media_type: str
    text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    completed_transcription_at: Optional[datetime] = None

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True


class GetEchoConfig(BaseModel):
    """Used for the `get echo` command."""

    echo_id: str
    include_segments = False

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True


class GetEchoResponse(BaseModel):
    """Used for the `get echo` command."""

    echo: Echo
    segments: Optional[List[Segment]] = None

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True


class DeleteEchoConfig(BaseModel):
    """Used for the `delete echo` command."""

    echo_id: str

    class Config:
        alias_generator = to_camelcase
        allow_population_by_field_name = True
