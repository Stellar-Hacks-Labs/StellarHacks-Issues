import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../app/api/v1/hackathons/[slug]/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('GET /api/v1/hackathons/[slug] route defense', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns hackathon detail for an existing slug', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/stellar-wave-11');
    const response = await GET(request, { params: Promise.resolve({ slug: 'stellar-wave-11' }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.slug).toBe('stellar-wave-11');
    expect(json.name).toBe('Stellar Wave 11 Hackathon');
    expect(json.contractId).toBe('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM');
  });

  it('returns 404 with standard error body when slug is not found', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/non-existent-hack');
    const response = await GET(request, { params: Promise.resolve({ slug: 'non-existent-hack' }) });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.code).toBe('NOT_FOUND');
    expect(json.error).toContain('non-existent-hack');
  });
});
