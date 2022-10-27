import logging

from lightning_app.utilities.app_helpers import Logger


def make_logger(name: str):
    logger = Logger(name)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter("%(levelname)s: %(message)s")
    console_handler.setFormatter(formatter)
    logger.logger.addHandler(console_handler)

    return logger
