from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class Echo(SQLModel, table=True):
    """Represents an audio file that can be transcribed."""

    id: str = Field(primary_key=True)
    source_file_path: str
    text: str
    # TODO(alecmerdler): Add more interesting metadata...


class GetEchoConfig(BaseModel):
    """Used for the `get echo` command."""

    echo_id: str


class DeleteEchoConfig(BaseModel):
    """Used for the `delete echo` command."""

    echo_id: str
