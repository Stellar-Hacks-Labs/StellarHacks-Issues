import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../../app/api/v1/hackathons/[slug]/results/route';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('GET /api/v1/hackathons/[slug]/results route defense', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns results for closed hackathon with scores revealed', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/soroban-build-2026/results');
    const response = await GET(request, { params: Promise.resolve({ slug: 'soroban-build-2026' }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.hackathonSlug).toBe('soroban-build-2026');
    expect(json.rankings[0].score).toBe(96.5);
    expect(json.rankings[0].scoreRevealed).toBe(true);
  });

  it('redacts scores to null when hackathon is not closed', async () => {
    const request = new Request('http://localhost/api/v1/hackathons/stellar-wave-11/results');
    const response = await GET(request, { params: Promise.resolve({ slug: 'stellar-wave-11' }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.rankings[0].score).toBeNull();
    expect(json.rankings[0].scoreRevealed).toBe(false);
  });
});
