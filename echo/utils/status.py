from typing import Dict, List

from lightning import LightningWork
from lightning.app.utilities.enum import CacheCallsKeys, WorkStageStatus


def calls(work: LightningWork):
    # Filter out the `latest_call_hash` entry in `work._calls`
    return [work._calls[call_hash] for call_hash in work._calls.keys() if call_hash != CacheCallsKeys.LATEST_CALL_HASH]


def pending_calls(work: LightningWork):
    """Returns the number of pending calls to `run()` method for the given Work."""
    pending_calls = 0
    for call in calls(work):
        for status in call["statuses"]:
            if status["stage"] == WorkStageStatus.PENDING:
                pending_calls += 1

    return pending_calls


def oldest_called(running_works: List[LightningWork]) -> LightningWork:
    """Find the Work which was called longest ago."""
    timestamp_of_most_recent_call: Dict[float, LightningWork] = {}

    for work in running_works:
        for call in calls(work):
            statuses = sorted(call["statuses"], key=lambda status: status["timestamp"])
            most_recent_status = statuses[-1]
            timestamp_of_most_recent_call[most_recent_status["timestamp"]] = work

    return timestamp_of_most_recent_call[sorted(timestamp_of_most_recent_call.keys())[-1]]
