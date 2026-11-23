import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
  resetRateLimits,
} from './rate-limit';

describe('rate limit enforcement', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows requests up to the defined limit and decreases remaining count', () => {
    const ip = '198.51.100.1';
    const limit = 3;

    const r1 = checkRateLimit(ip, limit);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(ip, limit);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(ip, limit);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = checkRateLimit(ip, limit);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfter).toBeGreaterThan(0);
  });

  it('formats documented rate limit headers properly', () => {
    const res = checkRateLimit('203.0.113.5', 10);
    const headers = getRateLimitHeaders(res);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('9');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
    expect(headers['Retry-After']).toBeUndefined();

    // Now exceed limit
    const blocked = {
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 45,
      retryAfter: 45,
    };
    const blockedHeaders = getRateLimitHeaders(blocked);
    expect(blockedHeaders['Retry-After']).toBe('45');
  });

  it('correctly extracts client IP from proxy headers', () => {
    const req1 = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.19, 10.0.0.1' },
    });
    expect(getClientIdentifier(req1)).toBe('203.0.113.19');

    const req2 = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': '198.51.100.77' },
    });
    expect(getClientIdentifier(req2)).toBe('198.51.100.77');
  });
});
