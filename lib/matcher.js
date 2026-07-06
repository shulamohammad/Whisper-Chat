export class Matcher {
  constructor() {
    this.waiting = [];
    this.pairs = new Map();
  }

  enqueue(socketId) {
    if (!this.waiting.includes(socketId) && !this.pairs.has(socketId)) {
      this.waiting.push(socketId);
    }
  }

  matchNext(socketId, blockedIds = new Set()) {
    const candidates = this.waiting.filter(
      (id) => id !== socketId && !blockedIds.has(id) && !this.pairs.has(id)
    );

    if (candidates.length === 0) {
      if (!this.waiting.includes(socketId)) {
        this.enqueue(socketId);
      }
      return null;
    }

    const partnerId = candidates[Math.floor(Math.random() * candidates.length)];

    this.waiting = this.waiting.filter((id) => id !== socketId && id !== partnerId);
    this.pairs.set(socketId, partnerId);
    this.pairs.set(partnerId, socketId);

    return partnerId;
  }

  getPartner(socketId) {
    return this.pairs.get(socketId) || null;
  }

  unpair(socketId) {
    const partner = this.pairs.get(socketId) || null;
    if (partner) {
      this.pairs.delete(socketId);
      this.pairs.delete(partner);
    }
    this.waiting = this.waiting.filter((id) => id !== socketId);
    return partner;
  }

  remove(socketId) {
    return this.unpair(socketId);
  }

  getPairedCount() {
    return this.pairs.size;
  }

  getWaitingCount() {
    return this.waiting.length;
  }
}
