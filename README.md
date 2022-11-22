<div align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/echo-logo-dark-mode.png">
      <img alt="Echo logo" src="./assets/echo-logo.svg" width="400px">
    </picture>
    <p>Transcription and captioning — faster, easier, and open source.</p>

<div align="center">

<p align="center" style="color:grey">Powered by <a href="https://openai.com/blog/whisper">OpenAI Whisper</a> (<a href="https://github.com/ggerganov/whisper.cpp">C++ implementation</a>)</p>

<p align="center">
  <a href="https://lightning.ai/pages/community/tutorial/deploy-openai-whisper/">Announcment</a> •
  <a href="#development">Development</a> •
  <a href="https://www.lightning.ai/">Lightning AI</a> •
  <a href="https://lightning.ai/apps">Lightning Apps Gallery</a>
</p>

[![Python Tests](https://github.com/Lightning-AI/LAI-Echo-App/actions/workflows/python-tests.yaml/badge.svg)](https://github.com/Lightning-AI/LAI-Echo-App/actions/workflows/python-tests.yaml)
[![ReadTheDocs](https://readthedocs.org/projects/pytorch-lightning/badge/?version=stable)](https://lightning.ai/lightning-docs/)
[![Slack](https://img.shields.io/badge/slack-chat-green.svg?logo=slack)](https://www.pytorchlightning.ai/community)
[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Lightning-AI/LAI-Echo-App/blob/main/LICENSE)

</div>
</div>

______________________________________________________________________

# Lightning Echo

Use Echo to generate quick captions of video and audio content. Powered by OpenAI’s Whisper, Echo benefits from near-human speech recognition to transcribe spoken words into text.

## Running Echo

### Configuration

<details>
  <summary>All configuration is done using environment variables, which are documented below with their default values.</summary>

| Name                                         | Type                                                                                      | Default Value    | Description                                                                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ECHO_MODE`                                  | `development`/`production`                                                                | `production`     | Toggles monitoring and other production-specific features.                                                                                                                               |
| `ECHO_MODEL_SIZE`                            | [See Whisper Docs](https://github.com/openai/whisper#available-models-and-languages)      | `base`           | The Whisper model to use.                                                                                                                                                                |
| `ECHO_ENABLE_MULTI_TENANCY`                  | boolean                                                                                   | `false`          | If enabled, users will not be able to see Echoes or data created by other users. If disabled, the app treats everyone as the same user so everything is visible to everyone who uses it. |
| `ECHO_RECOGNIZER_MIN_REPLICAS`               | integer                                                                                   | 1                | Minimum number of speech recognizer Works to keep running at all times, even if they are idle.                                                                                           |
| `ECHO_RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK`  | integer                                                                                   | 120              | Autoscaler will shut down any spare recognizer Works that haven't processed anything after this duration.                                                                                |
| `ECHO_RECOGNIZER_MAX_PENDING_CALLS_PER_WORK` | integer                                                                                   | 10               | Autoscaler will create a new recognizer Work if any existing recognizer Work has this many pending items to process.                                                                     |
| `ECHO_RECOGNIZER_AUTOSCALER_CRON_SCHEDULE`   | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `*/5 * * * *`    | How often the autoscaler will check to see if recognizer Works need to be scaled up/down                                                                                                 |
| `ECHO_RECOGNIZER_CLOUD_COMPUTE`              | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `gpu`            | The instance type each recognizer Work will use when running in the cloud.                                                                                                               |
| `ECHO_FILESERVER_CLOUD_COMPUTE`              | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `cpu-small`      | The instance type the fileserver Work will use when running in the cloud.                                                                                                                |
| `ECHO_FILESERVER_AUTH_TOKEN`                 | string                                                                                    | `None`           | Pre-shared key that prevents anyone other than the Flow from deleting files from the fileserver.                                                                                         |
| `ECHO_YOUTUBER_MIN_REPLICAS`                 | integer                                                                                   | 1                | Minimum number of downloader Works to keep running at all times, even if they are idle.                                                                                                  |
| `ECHO_YOUTUBER_MAX_IDLE_SECONDS_PER_WORK`    | integer                                                                                   | 120              | Autoscaler will shut down any spare downloader Works that haven't processed anything after this duration.                                                                                |
| `ECHO_YOUTUBER_MAX_PENDING_CALLS_PER_WORK`   | integer                                                                                   | 10               | Autoscaler will create a new downloader Work if any existing downloader Work has this many pending items to process.                                                                     |
| `ECHO_YOUTUBER_AUTOSCALER_CRON_SCHEDULE`     | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `*/5 * * * *`    | How often the autoscaler will check to see if downloader Works need to be scaled up/down                                                                                                 |
| `ECHO_YOUTUBER_CLOUD_COMPUTE`                | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `cpu`            | The instance type each downloader Work will use when running in the cloud.                                                                                                               |
| `ECHO_USER_ECHOES_LIMIT`                     | integer                                                                                   | 100              | Maximum number of Echoes that each user can create.                                                                                                                                      |
| `ECHO_SOURCE_TYPE_FILE_ENABLED`              | boolean                                                                                   | `true`           | Allows Echoes to be created from a local file upload (`.mp3`, `.mp4`, etc)                                                                                                               |
| `ECHO_SOURCE_TYPE_RECORDING_ENABLED`         | boolean                                                                                   | `true`           | Allows Echoes to be recorded with the device microphone using the UI.                                                                                                                    |
| `ECHO_SOURCE_TYPE_YOUTUBE_ENABLED`           | boolean                                                                                   | `true`           | Allows Echoes to be created by providing the URL to a public YouTube video.                                                                                                              |
| `ECHO_GARBAGE_COLLECTION_CRON_SCHEDULE`      | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `None`           | How often the garbage collector will check for old Echoes and delete them.                                                                                                               |
| `ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS`    | integer                                                                                   | 86400 (24 hours) | Echoes that are older than this will be deleted (if `ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS` is set).                                                                                   |
| `ECHO_VIDEO_SOURCE_MAX_DURATION_SECONDS`     | integer                                                                                   | 960 (15 minutes) | Restricts the length of YouTube videos that can be processed.                                                                                                                            |
| `ECHO_DATABASE_CLOUD_COMPUTE`                | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `cpu`            | The instance type the database server will use when running in the cloud.                                                                                                                |
| `ECHO_LOADBALANCER_AUTH_TOKEN`               | string                                                                                    | `None`           | Secret authentication token which is used for manually scaling the different Works using the `/api/scale` endpoint                                                                       |
| `ECHO_ROOT_PATH`                             | string                                                                                    | `/`              | Used to serve the app under a subpath or proxy.                                                                                                                                          |
| `ECHO_SENTRY_DSN`                            | string                                                                                    | `None`           | ID of the Sentry project for monitoring                                                                                                                                                  |
| `ECHO_SENTRY_SAMPLE_RATE`                    | float                                                                                     | `0.1`            | Sample rate for Sentry monitoring                                                                                                                                                        |

</details>

## Development

### Prerequisites

- Python 3.8+
- `git`
- `make`
- `ffmpeg`
- `libmagic`
- `yarn` (for frontend development)

1. Clone the repo:

```
git clone git@github.com:Lightning-AI/LAI-Echo-App.git
cd LAI-Echo-App
```

2. Create new virtual environment:

```
python -m venv venv
source ./venv/bin/activate
```

3. Install Python dependencies:

```
pip install -r requirements.txt
```

4. Install Whisper (C++ implementation)

```
cd $HOME
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make base
```

5. Install frontend dependencies:

```
cd echo/ui
yarn install
```

6. Build frontend:

```
cd echo/ui
yarn build
```

7. Run the app locally using `lightning` CLI:

```
# Run from project root
lightning run app app.py
```

### End-to-End Tests

End-to-end tests are written using [Cypress](https://www.cypress.io/). To run them against a local instance of the app, follow these instructions:

1. Clean the environment:

```sh
./scripts/clean.sh
```

2. Start app locally using the instructions above.

1. Run Cypress:

```sh
cd echo/ui
yarn run e2e
```

### Debug using VSCode

You can use the visual debugger for Python in VSCode to set breakpoints, inspect variables, and find exceptions. Add the following to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Lightning App (local)",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/debug.py",
      "console": "integratedTerminal",
      "justMyCode": false,
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```
