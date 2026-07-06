import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { config } from './lib/config.js';
import { Matcher } from './lib/matcher.js';
import { RateLimiter } from './lib/rateLimiter.js';
import { uniqueStrangerName } from './lib/names.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

const matcher = new Matcher();
const rateLimiter = new RateLimiter(config.maxMessagesPerWindow, config.rateLimitWindowMs);
const connectedSockets = new Set();
const displayNames = new Map();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('home.ejs');
});

app.get('/chat', (req, res) => {
  res.render('chat.ejs');
});

app.get('/api/user-count', (req, res) => {
  res.json({ count: connectedSockets.size });
});

function assignName(socketId) {
  if (!displayNames.has(socketId)) {
    displayNames.set(socketId, uniqueStrangerName(new Set(displayNames.values())));
  }
  return displayNames.get(socketId);
}

function getName(socketId) {
  return displayNames.get(socketId) || 'Stranger';
}

function tryMatch(socketId) {
  const partnerId = matcher.matchNext(socketId);
  if (partnerId) {
    io.to(socketId).emit('match', {
      partnerId,
      partnerName: getName(partnerId),
      yourName: getName(socketId),
    });
    io.to(partnerId).emit('match', {
      partnerId: socketId,
      partnerName: getName(socketId),
      yourName: getName(partnerId),
    });
  } else {
    io.to(socketId).emit('searching');
  }
}

function notifyPartnerLeft(partnerId, reason) {
  if (partnerId && connectedSockets.has(partnerId)) {
    io.to(partnerId).emit('partnerLeft', { reason });
    matcher.enqueue(partnerId);
    tryMatch(partnerId);
  }
}

function leaveAndRematch(socketId, reason) {
  const partnerId = matcher.unpair(socketId);
  notifyPartnerLeft(partnerId, reason);
  matcher.enqueue(socketId);
  tryMatch(socketId);
}

function validateImage(data) {
  if (!data || typeof data !== 'object') return false;
  const { mimeType, dataUrl } = data;
  if (!config.allowedImageTypes.includes(mimeType)) return false;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return false;
  const base64 = dataUrl.split(',')[1] || '';
  const sizeBytes = Math.ceil((base64.length * 3) / 4);
  return sizeBytes <= config.maxImageSizeBytes;
}

function validateMessage(message) {
  return typeof message === 'string' && message.trim().length > 0 && message.length <= config.maxMessageLength;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  connectedSockets.add(socket.id);
  socket.emit('userCount', connectedSockets.size);
  io.emit('userCount', connectedSockets.size);

  socket.on('joinChat', () => {
    assignName(socket.id);
    matcher.enqueue(socket.id);
    tryMatch(socket.id);
  });

  socket.on('message', (data) => {
    const partnerId = matcher.getPartner(socket.id);
    if (!partnerId || !data) return;

    if (!rateLimiter.allow(socket.id)) {
      socket.emit('error', { message: 'Slow down — too many messages.' });
      return;
    }

    const { message } = data;
    if (!validateMessage(message)) {
      socket.emit('error', { message: `Message must be 1–${config.maxMessageLength} characters.` });
      return;
    }

    io.to(partnerId).emit('message', {
      message: message.trim(),
      timestamp: Date.now(),
      type: 'text',
    });
  });

  socket.on('typing', () => {
    const partnerId = matcher.getPartner(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('typing');
    }
  });

  socket.on('stopTyping', () => {
    const partnerId = matcher.getPartner(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('stopTyping');
    }
  });

  socket.on('image', (data) => {
    const partnerId = matcher.getPartner(socket.id);
    if (!partnerId || !validateImage(data)) {
      socket.emit('error', { message: 'Invalid image. Use JPEG, PNG, GIF, or WebP under 2 MB.' });
      return;
    }

    if (!rateLimiter.allow(socket.id)) {
      socket.emit('error', { message: 'Slow down — too many messages.' });
      return;
    }

    io.to(partnerId).emit('message', {
      message: data.dataUrl,
      timestamp: Date.now(),
      type: 'image',
    });
  });

  socket.on('skip', () => {
    leaveAndRematch(socket.id, 'skip');
  });

  socket.on('findNew', () => {
    leaveAndRematch(socket.id, 'rematch');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedSockets.delete(socket.id);
    rateLimiter.remove(socket.id);
    displayNames.delete(socket.id);

    const partnerId = matcher.remove(socket.id);
    notifyPartnerLeft(partnerId, 'disconnect');

    io.emit('userCount', connectedSockets.size);
  });
});

async function startServer() {
  if (config.redisUrl) {
    try {
      const pubClient = createClient({ url: config.redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Redis adapter connected');
    } catch (err) {
      console.warn('Redis connection failed, running without adapter:', err.message);
    }
  }

  server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
}

startServer();

export { matcher, rateLimiter };
