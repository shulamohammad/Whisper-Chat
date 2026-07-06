# Whisper-Chat

Anonymous real-time chat with strangers. No accounts, no history — connect, converse, disappear.

## Features

- Random 1:1 stranger matching with a proper waiting queue
- Text chat with typing indicators and message bubbles
- Image sharing (JPEG, PNG, GIF, WebP up to 2 MB)
- Skip to next stranger
- Partner disconnect handling with auto-rematch
- Rate limiting and XSS-safe message rendering
- Live online user count
- Optional Redis adapter for multi-instance scaling

## Quick start

```bash
npm install
cp .env.example .env   # optional — defaults work fine
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm test` | Run unit tests |

## Configuration

See `.env.example` for all options:

- `PORT` — server port (default 3000)
- `REDIS_URL` — optional Redis URL for scaling across multiple processes
- `MAX_MESSAGE_LENGTH` — character limit per message
- `MAX_MESSAGES_PER_WINDOW` / `RATE_LIMIT_WINDOW_MS` — spam protection
- `MAX_IMAGE_SIZE_MB` — image upload size limit

## Project structure

```
index.js          Server (Express + Socket.IO)
lib/              Matching, rate limiting
views/            EJS templates (home + chat)
public/           CSS, client JS, images
tests/            Unit tests
```
