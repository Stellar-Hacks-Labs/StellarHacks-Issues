import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../app/api/v1/hackathons/[slug]/projects/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('GET /api/v1/hackathons/[slug]/projects route defense', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns projects submitted to the hackathon with pagination', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/stellar-wave-11/projects');
    const response = await GET(request, { params: Promise.resolve({ slug: 'stellar-wave-11' }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);
    expect(json.data[0].title).toBe('Soroban Liquidity Engine');
    expect(json.data[0].members).toBeDefined();
    expect(json.pagination.total).toBe(2);
  });

  it('returns 404 for an invalid hackathon slug', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/fake-slug/projects');
    const response = await GET(request, { params: Promise.resolve({ slug: 'fake-slug' }) });

    expect(response.status).toBe(404);
  });
});
