export class RateLimiter {
  constructor(maxMessages, windowMs) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.timestamps = new Map();
  }

  allow(socketId) {
    const now = Date.now();
    const recent = (this.timestamps.get(socketId) || []).filter(
      (t) => now - t < this.windowMs
    );

    if (recent.length >= this.maxMessages) {
      return false;
    }

    recent.push(now);
    this.timestamps.set(socketId, recent);
    return true;
  }

  remove(socketId) {
    this.timestamps.delete(socketId);
  }
}
