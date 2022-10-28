from lightning.app.runners import MultiProcessRuntime

from app import app

if __name__ == "__main__":
    MultiProcessRuntime(app).dispatch()
