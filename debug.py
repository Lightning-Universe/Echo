if __name__ == "__main__":
    from lightning_app.cli.lightning_cli import _run_app

    _run_app(
        file="./app.py",
        cloud=False,
        name="echo",
        open_ui=False,
        blocking=False,
        cluster_id=None,
        env=[],
        no_cache=False,
        without_server=False,
    )
