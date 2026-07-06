# Whisper Chat

**Anonymous real-time chat with strangers.** No accounts, no history — connect, converse, disappear.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## About

Whisper Chat pairs you with a random stranger for a private 1:1 conversation. Messages are not stored — when you leave, the chat is gone.

## Features

| | |
|---|---|
| **Stranger matching** | Random 1:1 pairing with a waiting queue |
| **Real-time chat** | Text messages with typing indicators |
| **Image sharing** | JPEG, PNG, GIF, WebP (up to 2 MB) |
| **Skip & leave** | Move to the next stranger or end the session |
| **Safety** | Rate limiting and XSS-safe message rendering |
| **Scaling** | Optional Redis adapter for multiple server instances |

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or later

```bash
git clone https://github.com/shulamohammad/Whisper-Chat.git
cd Whisper-Chat
npm install
cp .env.example .env   # optional — defaults work out of the box
npm start
```

Open **http://localhost:3000** in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm test` | Run unit tests |

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `REDIS_URL` | — | Redis URL for multi-instance scaling |
| `CORS_ORIGIN` | `*` | Allowed Socket.IO origin |
| `MAX_MESSAGE_LENGTH` | `500` | Max characters per message |
| `MAX_MESSAGES_PER_WINDOW` | `10` | Messages allowed per rate-limit window |
| `RATE_LIMIT_WINDOW_MS` | `5000` | Rate-limit window (ms) |
| `MAX_IMAGE_SIZE_MB` | `2` | Max image upload size |

## Tech stack

- **Backend** — Node.js, Express, Socket.IO
- **Frontend** — EJS, vanilla JavaScript, custom CSS
- **Optional** — Redis (`@socket.io/redis-adapter`)

## Project structure

```
index.js            Express + Socket.IO server
lib/                Matching queue, rate limiter, config
views/              Home and chat pages (EJS)
public/             Styles, client scripts, assets
tests/              Unit tests
```

## License

[ISC](LICENSE)
