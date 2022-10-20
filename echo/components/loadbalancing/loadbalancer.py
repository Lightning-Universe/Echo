import time
import uuid
from multiprocessing import Lock
from typing import Any, Callable, Dict

from lightning import LightningFlow, LightningWork
from lightning_app.structures import Dict as LightningDict
from lightning_app.utilities.app_helpers import Logger
from lightning_app.utilities.enum import WorkStageStatus

from echo.utils.status import oldest_called, pending_calls

DEFAULT_WORK_ATTRIBUTE_PREFIX = "loadbalanced_work_"
DEFAULT_MAX_IDLE_SECONDS_PER_WORK = 120
DEFAULT_MAX_PENDING_CALLS_PER_WORK = 10


logger = Logger(__name__)


class LoadBalancer(LightningFlow):
    """Enables autoscaling and distribution of tasks to Works."""

    def __init__(
        self,
        name: str = DEFAULT_WORK_ATTRIBUTE_PREFIX,
        max_pending_calls_per_work=DEFAULT_MAX_PENDING_CALLS_PER_WORK,
        max_idle_seconds_per_work=DEFAULT_MAX_IDLE_SECONDS_PER_WORK,
        create_work: Callable[[Any], LightningWork] = None,
        dummy_run_kwargs: Dict[str, Any] = {},
    ):
        super().__init__()

        self.max_pending_calls_per_work = max_pending_calls_per_work
        self.max_idle_seconds_per_work = max_idle_seconds_per_work
        self.workers = LightningDict()

        self._name = name
        self._work_attribute_prefix = f"{self._name}_" if self.name != "" else DEFAULT_WORK_ATTRIBUTE_PREFIX
        self._work_pool_rw_lock = Lock()
        self._work_pool: Dict[str, LightningWork] = {}
        self._create_work = create_work
        self._dummy_run_kwargs = dummy_run_kwargs

    def _add_work(self):
        """Adds the given Work to the Flow using a unique attribute name."""
        new_work: LightningWork = self._create_work()

        logger.info(f"Added new Work to pool: {new_work.name}")

        work_attribute = f"{self._work_attribute_prefix}{uuid.uuid4().hex}"
        self._work_pool[work_attribute] = new_work
        self.workers[work_attribute] = new_work

        return new_work

    def _remove_work(self, work_name: str):
        """Stops the given Work and removes it from the pool."""
        if work_name in self._work_pool:
            self._work_pool[work_name].stop()
            del self._work_pool[work_name]

    @property
    def pool(self):
        """Returns the list of running Works."""
        return [work for work in self._work_pool.values() if work.status.stage != WorkStageStatus.STOPPED]

    def _is_idle(self, work: LightningWork):
        """Checks if a given Work has not been called for longer than the configured allowed idle time."""
        if not work.status.stage == WorkStageStatus.SUCCEEDED:
            return False

        return (work.status.timestamp + self.max_idle_seconds_per_work) < time.time()

    def ensure_min_replicas(self, min_replicas: int):
        """Checks for idle Works and stops them to save on cloud costs."""
        with self._work_pool_rw_lock:
            # Ensure that we have at least `min_replicas` Works running
            while len(self._work_pool.copy().items()) < min_replicas:
                new_work = self._add_work()
                new_work.run(**self._dummy_run_kwargs)

            # Check for idle Works and stop them to save on cloud costs
            if len(self._work_pool.items()) <= min_replicas:
                return

            for work_name, work in self._work_pool.copy().items():
                if self._is_idle(work):
                    logger.info(f"Found idle Work ({work.name}), stopping it")
                    self._remove_work(work_name)

    def run(self, *args, **kwargs):
        with self._work_pool_rw_lock:
            succeeded = [work for work in self.pool if work.status.stage == WorkStageStatus.SUCCEEDED]
            running = [work for work in self.pool if work.status.stage == WorkStageStatus.RUNNING]
            available = [work for work in running if pending_calls(work) < self.max_pending_calls_per_work]
            pending = [
                work
                for work in self.pool
                if work.status.stage in [WorkStageStatus.PENDING, WorkStageStatus.NOT_STARTED]
            ]

            # Try to use a previously succeeded Work first
            for work in succeeded:
                logger.info(f"Found succeeded Work ({work.name}), calling `run()`")
                work.run(*args, **kwargs)
                return

            # Try to use a Work that is currently running and has not reached the max pending calls
            if len(available) > 0:
                oldest_called_work = oldest_called(available)
                logger.info(f"Found running Work ({oldest_called_work.name}), calling `run()`")
                oldest_called_work.run(*args, **kwargs)
                return

            # If all Works are at maximum capacity, check if we should trigger a scale up
            if len(pending) == 0:
                logger.info("No Works available, scaling up")
                new_work = self._add_work()
                logger.info(f"Scaling up, created new Work ({new_work.name})")
                # NOTE: Calling `run()` with dummy args so that cloud machine is created
                new_work.run(**self._dummy_run_kwargs)

                if len(running) == 0:
                    logger.info(f"No other Works are running, calling `run()` on new Work ({new_work.name})")
                    new_work.run(*args, **kwargs)
                    return

            # Find the Work with the least number of pending `run()` calls and use it
            if len(running) > 0:
                current_pending_calls = [(work, pending_calls(work)) for work in running]
                least_overloaded = min(current_pending_calls, key=lambda work: work[1])
                logger.info(f"Found least overloaded running Work ({least_overloaded[0].name}), calling `run()`")
                least_overloaded[0].run(*args, **kwargs)
            else:
                current_pending_calls = [(work, pending_calls(work)) for work in pending]
                least_overloaded = min(current_pending_calls, key=lambda work: work[1])
                logger.info(f"Found least overloaded pending Work ({least_overloaded[0].name}), calling `run()`")
                least_overloaded[0].run(*args, **kwargs)
