import pytest
from lightning import LightningApp, LightningFlow, LightningWork
from lightning_app.runners import MultiProcessRuntime

from echo.components.loadbalancing.loadbalancer import LoadBalancer
from echo.utils.status import pending_calls


class TestWork(LightningWork):
    def __init__(self):
        super().__init__()
        self.counter = 0

    def run(self):
        self.counter += 1


class LoadBalancerTestApp(LightningFlow):
    def __init__(
        self, test_name: str, min_replicas: int, max_pending_calls_per_work: int, max_idle_seconds_per_work: int
    ):
        super().__init__()
        self.test_name = test_name
        self.min_replicas = min_replicas
        self.max_pending_calls_per_work = max_pending_calls_per_work
        self.max_idle_seconds_per_work = max_idle_seconds_per_work

        self.work = LoadBalancer(
            min_replicas=min_replicas,
            max_idle_seconds_per_work=max_idle_seconds_per_work,
            max_pending_calls_per_work=max_pending_calls_per_work,
            create_work=lambda: TestWork(),
        )

    def run(self):
        # Ensure that load balancer starts with zero running Works
        if self.test_name == "starts_with_zero_running_works":
            assert len(self.work.pool) == 0

            self._exit()

        # Ensure that load balancer does not exceed the max pending calls per Work
        if self.test_name == "does_not_exceed_max_pending_calls_per_work":
            self.work.run()

            if len(self.work.pool) > self.min_replicas:
                for work in self.work.pool:
                    assert pending_calls(work) <= self.max_pending_calls_per_work

                self._exit()


@pytest.mark.parametrize(
    "test_name, min_replicas, max_pending_calls_per_work, max_idle_seconds_per_work",
    [
        ("starts_with_zero_running_works", 1, 5, 10),
        ("does_not_exceed_max_pending_calls_per_work", 1, 5, 10),
        # TODO: Ensure that load balancer removes idle Works
    ],
)
def test_loadbalancer(test_name, min_replicas, max_pending_calls_per_work, max_idle_seconds_per_work):
    app = LightningApp(
        LoadBalancerTestApp(
            test_name=test_name,
            min_replicas=min_replicas,
            max_pending_calls_per_work=max_pending_calls_per_work,
            max_idle_seconds_per_work=max_idle_seconds_per_work,
        )
    )

    MultiProcessRuntime(app).dispatch()
