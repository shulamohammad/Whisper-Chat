import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Matcher } from '../lib/matcher.js';
import { RateLimiter } from '../lib/rateLimiter.js';

describe('Matcher', () => {
  test('pairs two users from the waiting queue', () => {
    const matcher = new Matcher();
    matcher.enqueue('a');
    matcher.enqueue('b');
    const partner = matcher.matchNext('b');
    assert.equal(partner, 'a');
    assert.equal(matcher.getPartner('a'), 'b');
    assert.equal(matcher.getPartner('b'), 'a');
  });

  test('returns null when no partner is available', () => {
    const matcher = new Matcher();
    matcher.enqueue('solo');
    const partner = matcher.matchNext('solo');
    assert.equal(partner, null);
    assert.equal(matcher.getWaitingCount(), 1);
  });

  test('unpairs and returns partner id', () => {
    const matcher = new Matcher();
    matcher.enqueue('a');
    matcher.enqueue('b');
    matcher.matchNext('b');
    const left = matcher.unpair('a');
    assert.equal(left, 'b');
    assert.equal(matcher.getPartner('b'), null);
  });

  test('excludes blocked users from matching', () => {
    const matcher = new Matcher();
    matcher.enqueue('a');
    matcher.enqueue('b');
    matcher.enqueue('c');
    const blocked = new Set(['a']);
    const partner = matcher.matchNext('c', blocked);
    assert.equal(partner, 'b');
  });

  test('does not double-pair a user', () => {
    const matcher = new Matcher();
    matcher.enqueue('a');
    matcher.enqueue('b');
    matcher.matchNext('a');
    const second = matcher.matchNext('b');
    assert.equal(second, null);
  });
});

describe('RateLimiter', () => {
  test('allows messages within limit', () => {
    const limiter = new RateLimiter(3, 5000);
    assert.equal(limiter.allow('user1'), true);
    assert.equal(limiter.allow('user1'), true);
    assert.equal(limiter.allow('user1'), true);
  });

  test('blocks messages over limit', () => {
    const limiter = new RateLimiter(2, 5000);
    assert.equal(limiter.allow('user1'), true);
    assert.equal(limiter.allow('user1'), true);
    assert.equal(limiter.allow('user1'), false);
  });
});

describe('generateStrangerName', () => {
  test('generates adjective-noun-number format', async () => {
    const { generateStrangerName, uniqueStrangerName } = await import('../lib/names.js');
    const name = generateStrangerName();
    assert.match(name, /^[A-Z][a-z]+[A-Z][a-z]+\d{2,}$/);
    const unique = uniqueStrangerName(new Set([name]));
    assert.notEqual(unique, name);
  });
});
