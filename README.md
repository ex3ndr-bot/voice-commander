# Voice Commander

Voice Commander is a local desktop-style web app that simulates a voice-controlled automation agent. It combines a TypeScript + Express backend with a premium dark UI, browser voice input via the Web Speech API, a live task timeline, and a lightweight persona layer that learns recurring commands and topics.

## Features

- Express server on port `3000`
- Static single-page frontend served from `public/`
- API endpoints for command execution, task history, and persona retrieval
- Simulated task engine for commands like `organize files`, `classify documents`, and `summarize text`
- Persistent `persona.json` storage for learned preferences, frequent commands, and topics
- Voice input support in compatible browsers

## Project Structure

```text
voice-commander/
├── package.json
├── tsconfig.json
├── persona.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
└── src/
    ├── persona.ts
    ├── server.ts
    └── taskEngine.ts
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000`

## API

- `POST /api/command`
  - Body: `{ "command": "organize files" }`
- `GET /api/history`
- `GET /api/persona`

## Notes

- Task execution is simulated for local development.
- Persona signals persist in `persona.json`.
- Voice recognition depends on browser support for `SpeechRecognition` or `webkitSpeechRecognition`.
