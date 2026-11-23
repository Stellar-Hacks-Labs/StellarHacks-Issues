import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../app/api/v1/hackathons/[slug]/proof/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('GET /api/v1/hackathons/[slug]/proof route defense', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns cryptographic proof and anchor data for hackathon', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/stellar-wave-11/proof');
    const response = await GET(request, { params: Promise.resolve({ slug: 'stellar-wave-11' }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.hackathonSlug).toBe('stellar-wave-11');
    expect(json.constitutionHash).toBeDefined();
    expect(json.merkleRoot).toBeDefined();
    expect(json.verified).toBe(true);
  });

  it('returns 404 for unknown hackathon slug', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/unknown-event/proof');
    const response = await GET(request, { params: Promise.resolve({ slug: 'unknown-event' }) });

    expect(response.status).toBe(404);
  });
});
