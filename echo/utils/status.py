from typing import Dict, List

from lightning import LightningWork
from lightning_app.utilities.enum import CacheCallsKeys, WorkStageStatus


def pending_calls(work: LightningWork):
    """Returns the number of pending calls to `run()` method for the given Work."""
    # Filter out the `latest_call_hash` entry in `work._calls`
    calls = [work._calls[call_hash] for call_hash in work._calls.keys() if call_hash != CacheCallsKeys.LATEST_CALL_HASH]

    pending_calls = 0
    for call in calls:
        for status in call["statuses"]:
            if status["stage"] == WorkStageStatus.PENDING:
                pending_calls += 1

    return pending_calls


def oldest_called(running_works: List[LightningWork]) -> LightningWork:
    """Find the Work which was called longest ago."""
    timestamp_of_most_recent_call: Dict[float, LightningWork] = {}

    for work in running_works:
        # Filter out the `latest_call_hash` entry in `work._calls`
        calls = [
            work._calls[call_hash] for call_hash in work._calls.keys() if call_hash != CacheCallsKeys.LATEST_CALL_HASH
        ]

        for call in calls:
            statuses = sorted(call["statuses"], key=lambda status: status["timestamp"])
            most_recent_status = statuses[-1]
            timestamp_of_most_recent_call[most_recent_status["timestamp"]] = work

    return timestamp_of_most_recent_call[sorted(timestamp_of_most_recent_call.keys())[-1]]
