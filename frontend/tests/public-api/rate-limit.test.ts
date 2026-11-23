import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getHackathons } from '../../app/api/v1/hackathons/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('Public API rate limiting on routes', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('serves 429 and Retry-After header when client exceeds rate limit', async () => {
    const clientHeaders = { 'x-forwarded-for': '198.51.100.222' };

    // Fire 60 requests (the limit)
    for (let i = 0; i < 60; i++) {
      const res = await getHackathons(
        new Request('http://localhost/api/v1/hackathons', { headers: clientHeaders })
      );
      expect(res.status).toBe(200);
    }

    // 61st request must be rejected with 429
    const blockedRes = await getHackathons(
      new Request('http://localhost/api/v1/hackathons', { headers: clientHeaders })
    );
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    expect(Number(blockedRes.headers.get('Retry-After'))).toBeGreaterThan(0);

    const json = await blockedRes.json();
    expect(json.code).toBe('RATE_LIMITED');
  });
});
