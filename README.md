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
