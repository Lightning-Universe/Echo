import functools
from typing import Type

from sqlmodel import SQLModel, inspect


@functools.lru_cache
def get_primary_key(model_type: Type[SQLModel]) -> str:
    primary_keys = inspect(model_type).primary_key

    if len(primary_keys) != 1:
        raise ValueError(f"The model {model_type.__name__} should have a single primary key field.")

    return primary_keys[0].name
