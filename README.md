<div align="center">
    <img src="https://user-images.githubusercontent.com/11700385/193478702-76070aa3-1eec-415b-ab06-110b6c1c1459.svg" width="400px">
    <p>Transcription and captioning — faster, easier, and open source.</p>

<div align="center">

<p align="center" style="color:grey">Powered by <a href="https://openai.com/blog/whisper">OpenAI Whisper</a></p>

<p align="center">
  <a href="#development">Development</a> •
  <a href="https://www.lightning.ai/">Lightning AI</a> •
  <a href="https://lightning.ai/apps">Lightning Apps Gallery</a>
</p>

[![ReadTheDocs](https://readthedocs.org/projects/pytorch-lightning/badge/?version=stable)](https://lightning.ai/lightning-docs/)
[![Slack](https://img.shields.io/badge/slack-chat-green.svg?logo=slack)](https://www.pytorchlightning.ai/community)
[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Lightning-AI/LAI-Echo-App/blob/main/LICENSE)

</div>
</div>

______________________________________________________________________

# Lightning Echo

Use Echo to generate quick captions of video and audio content. Powered by OpenAI’s Whisper, Echo benefits from near-human speech recognition to transcribe spoken words into text.

## Runing Echo

### Configuration

All configuration is done using environment variables, which are documented below with their default values.

| Name                                               | Type                                                                                      | Default Value | Description                                                                                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ECHO_MODE`                                        | `development`/`production`                                                                | `production`  | Toggles monitoring and other production-specific features.                                                                                                                               |
| `ECHO_MODEL_SIZE`                                  | [See Whisper Docs](https://github.com/openai/whisper#available-models-and-languages)      | `base`        | The Whisper model to use.                                                                                                                                                                |
| `ECHO_ENABLE_MULTI_TENANCY`                        | boolean                                                                                   | `false`       | If enabled, users will not be able to see Echoes or data created by other users. If disabled, the app treats everyone as the same user so everything is visible to everyone who uses it. |
| `ECHO_RECOGNIZER_MIN_REPLICAS`                     | integer                                                                                   | 1             | Minimum number of speech recognizer Works to keep running at all times, even if they are idle.                                                                                           |
| `ECHO_RECOGNIZER_MAX_IDLE_SECONDS_PER_WORK`        | integer                                                                                   | 120           | Autoscaler will shut down any spare recognizer Works that haven't processed anything after this duration.                                                                                |
| `ECHO_RECOGNIZER_MAX_PENDING_CALLS_PER_WORK`       | integer                                                                                   | 10            | Autoscaler will create a new recognizer Work if any existing recognizer Work has this many pending items to process.                                                                     |
| `ECHO_RECOGNIZER_AUTOSCALER_CRON_SCHEDULE_DEFAULT` | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `*/5 * * * *` | How often the autoscaler will check to see if recognizer Works need to be scaled up/down                                                                                                 |
| `ECHO_RECOGNIZER_CLOUD_COMPUTE`                    | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `gpu`         | The instance type each recognizer Work will use when running in the cloud.                                                                                                               |
| `ECHO_YOUTUBER_MIN_REPLICAS`                       | integer                                                                                   | 1             | Minimum number of downloader Works to keep running at all times, even if they are idle.                                                                                                  |
| `ECHO_YOUTUBER_MAX_IDLE_SECONDS_PER_WORK`          | integer                                                                                   | 120           | Autoscaler will shut down any spare downloader Works that haven't processed anything after this duration.                                                                                |
| `ECHO_YOUTUBER_MAX_PENDING_CALLS_PER_WORK`         | integer                                                                                   | 10            | Autoscaler will create a new downloader Work if any existing downloader Work has this many pending items to process.                                                                     |
| `ECHO_YOUTUBER_AUTOSCALER_CRON_SCHEDULE_DEFAULT`   | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `*/5 * * * *` | How often the autoscaler will check to see if downloader Works need to be scaled up/down                                                                                                 |
| `ECHO_YOUTUBER_CLOUD_COMPUTE`                      | [Cloud Compute](https://lightning.ai/lightning-docs/core_api/lightning_work/compute.html) | `cpu`         | The instance type each downloader Work will use when running in the cloud.                                                                                                               |
| `ECHO_USER_ECHOES_LIMIT`                           | integer                                                                                   | 100           | Maximum number of Echoes that each user can create.                                                                                                                                      |
| `ECHO_SOURCE_TYPE_FILE_ENABLED`                    | boolean                                                                                   | `true`        | Allows Echoes to be created from a local file upload (`.mp3`, `.mp4`, etc)                                                                                                               |
| `ECHO_SOURCE_TYPE_RECORDING_ENABLED`               | boolean                                                                                   | `true`        | Allows Echoes to be recorded with the device microphone using the UI.                                                                                                                    |
| `ECHO_SOURCE_TYPE_YOUTUBE_ENABLED`                 | boolean                                                                                   | `true`        | Allows Echoes to be created by providing the URL to a public YouTube video.                                                                                                              |
| `ECHO_GARBAGE_COLLECTION_CRON_SCHEDULE`            | [cron](https://crontab.guru/#*_*_*_*_*)                                                   | `None`        | How often the garbage collector will check for old Echoes and delete them.                                                                                                               |
| `ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS`          | integer                                                                                   | 86400         | Echoes that are older than this will be deleted (if `ECHO_GARBAGE_COLLECTION_MAX_AGE_SECONDS` is set).                                                                                   |

## Development

### Prerequisites

- Python 3.8+
- `ffmpeg`
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

4. Install frontend dependencies:

```
cd echo/ui
yarn install
```

5. Build frontend:

```
cd echo/ui
yarn build
```

6. Run the app locally using `lightning` CLI:

```
# Run from project root
lightning run app app.py
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
