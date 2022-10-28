import time
import uuid
from multiprocessing import Lock
from typing import Any, Callable, Dict

from lightning import LightningFlow, LightningWork
from lightning.app.utilities.app_helpers import Logger
from lightning.app.utilities.enum import WorkStageStatus

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
        min_replicas: int = 1,
        max_pending_calls_per_work=DEFAULT_MAX_PENDING_CALLS_PER_WORK,
        max_idle_seconds_per_work=DEFAULT_MAX_IDLE_SECONDS_PER_WORK,
        create_work: Callable[[Any], LightningWork] = None,
    ):
        super().__init__()

        self.min_replicas = min_replicas
        self.max_pending_calls_per_work = max_pending_calls_per_work
        self.max_idle_seconds_per_work = max_idle_seconds_per_work

        self._name = name
        self._work_attribute_prefix = f"{self._name}_" if self.name != "" else DEFAULT_WORK_ATTRIBUTE_PREFIX
        self._work_pool_rw_lock = Lock()
        self._work_pool: Dict[str, LightningWork] = {}
        self._create_work = create_work

    def _add_work(self):
        """Adds the given Work to the Flow using `setattr` and a unique attribute name."""
        new_work: LightningWork = self._create_work()

        work_attribute = f"{self._work_attribute_prefix}{uuid.uuid4().hex}"
        self._work_pool[work_attribute] = new_work
        setattr(self, work_attribute, new_work)

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

    def ensure_min_replicas(self):
        """Checks for idle Works and stops them to save on cloud costs."""
        with self._work_pool_rw_lock:
            # Check for idle Works and stop them to save on cloud costs
            for work_name, work in self._work_pool.copy().items():
                # FIXME(alecmerdler)
                if len(self._work_pool.items()) <= self.min_replicas:
                    return

                if self._is_idle(work):
                    logger.info(f"Found idle Work ({work.name}), stopping it")
                    self._remove_work(work_name)

    def run(self, *args, **kwargs):
        with self._work_pool_rw_lock:
            succeeded = [work for work in self.pool if work.status.stage == WorkStageStatus.SUCCEEDED]
            running = [work for work in self.pool if work.status.stage == WorkStageStatus.RUNNING]
            available = [work for work in running if pending_calls(work) < self.max_pending_calls_per_work]

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

            # If no Works are available, scale up and use the new one
            logger.info("No Works available, scaling up")
            new_work = self._add_work()
            logger.info(f"Scaling up - created new Work ({new_work.name}), calling `run()`")
            new_work.run(*args, **kwargs)
