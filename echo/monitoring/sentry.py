import os

import sentry_sdk


def init_sentry():
    if os.getenv("ECHO_MODE", "production") == "production":
        sentry_dsn = os.getenv("ECHO_SENTRY_DSN")
        if sentry_dsn:
            sentry_sdk.init(
                dsn=sentry_dsn,
                # Set traces_sample_rate to 1.0 to capture 100%
                # of transactions for performance monitoring.
                # We recommend adjusting this value in production.
                traces_sample_rate=os.environ.get("ECHO_SENTRY_SAMPLE_RATE", 0.1),
            )
