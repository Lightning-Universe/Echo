import pytest

from echo.media.video import is_valid_youtube_url, youtube_video_length


@pytest.mark.parametrize(
    "youtube_url, expected",
    [
        ("https://www.youtube.com/watch?v=tVzgHvTuwdU", True),
        ("https://www.youtube.com/watch?v=", False),
        ("asdfsadfas", False),
        ("", False),
    ],
)
def test_is_valid_youtube_url(youtube_url: str, expected: bool):
    assert is_valid_youtube_url(youtube_url) == expected


@pytest.mark.parametrize(
    "youtube_url, expected_length",
    [
        ("https://www.youtube.com/watch?v=tVzgHvTuwdU", 964),
        ("https://www.youtube.com/watch?v=vFwHl7W5ooE", 149),
        ("https://www.youtube.com/watch?v=iDulhoQ2pro", 1626),
    ],
)
def test_youtube_video_length(youtube_url: str, expected_length: int):
    assert youtube_video_length(youtube_url) == expected_length
