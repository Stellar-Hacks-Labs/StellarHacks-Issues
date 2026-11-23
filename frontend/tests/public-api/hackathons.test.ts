import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../app/api/v1/hackathons/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('GET /api/v1/hackathons route defense', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns paginated hackathons list with standard headers', async () => {
    const request = new Request('http://localhost/api/v1/hackathons?page=1&per_page=10');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(response.headers.get('Cache-Control')).toContain('public');
    expect(response.headers.get('ETag')).toBeDefined();

    const json = await response.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.pagination.page).toBe(1);
    expect(json.pagination.perPage).toBe(10);
    expect(json.pagination.total).toBeGreaterThan(0);
  });

  it('supports 304 Not Modified when ETag matches If-None-Match', async () => {
    const firstReq = new Request('http://localhost/api/v1/hackathons');
    const firstRes = await GET(firstReq);
    const etag = firstRes.headers.get('ETag');

    const secondReq = new Request('http://localhost/api/v1/hackathons', {
      headers: { 'if-none-match': etag! },
    });
    const secondRes = await GET(secondReq);
    expect(secondRes.status).toBe(304);
  });
});
