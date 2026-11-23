import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getHackathons } from '../../app/api/v1/hackathons/route';
import { GET as getHackathon } from '../../app/api/v1/hackathons/[slug]/route';
import { GET as getProjects } from '../../app/api/v1/hackathons/[slug]/projects/route';
import { GET as getResults } from '../../app/api/v1/hackathons/[slug]/results/route';
import { GET as getProof } from '../../app/api/v1/hackathons/[slug]/proof/route';
import { GET as getOpenApi } from '../../app/api/v1/openapi.json/route';
import { validateAgainstSchema } from '../../lib/public-api/openapi';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('OpenAPI contract compliance tests', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('validates /hackathons response against PublicHackathon and PaginationMeta schema', async () => {
    const res = await getHackathons(new Request('http://localhost/api/v1/hackathons'));
    expect(res.status).toBe(200);
    const json = await res.json();

    const paginationValidation = validateAgainstSchema(json.pagination, 'PaginationMeta');
    expect(paginationValidation.valid).toBe(true);

    for (const item of json.data) {
      const itemValidation = validateAgainstSchema(item, 'PublicHackathon');
      expect(itemValidation.valid).toBe(true);
    }
  });

  it('validates /hackathons/{slug} response against PublicHackathon schema', async () => {
    const res = await getHackathon(
      new Request('http://localhost/api/v1/hackathons/stellar-wave-11'),
      { params: Promise.resolve({ slug: 'stellar-wave-11' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    const validation = validateAgainstSchema(json, 'PublicHackathon');
    expect(validation.valid).toBe(true);
  });

  it('validates /hackathons/{slug}/projects response against PublicProject and PaginationMeta', async () => {
    const res = await getProjects(
      new Request('http://localhost/api/v1/hackathons/stellar-wave-11/projects'),
      { params: Promise.resolve({ slug: 'stellar-wave-11' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    const paginationValidation = validateAgainstSchema(json.pagination, 'PaginationMeta');
    expect(paginationValidation.valid).toBe(true);

    for (const item of json.data) {
      const itemValidation = validateAgainstSchema(item, 'PublicProject');
      expect(itemValidation.valid).toBe(true);
    }
  });

  it('validates /hackathons/{slug}/results response against PublicResult schema', async () => {
    const res = await getResults(
      new Request('http://localhost/api/v1/hackathons/soroban-build-2026/results'),
      { params: Promise.resolve({ slug: 'soroban-build-2026' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    const validation = validateAgainstSchema(json, 'PublicResult');
    expect(validation.valid).toBe(true);
  });

  it('validates /hackathons/{slug}/proof response against PublicProof schema', async () => {
    const res = await getProof(
      new Request('http://localhost/api/v1/hackathons/stellar-wave-11/proof'),
      { params: Promise.resolve({ slug: 'stellar-wave-11' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    const validation = validateAgainstSchema(json, 'PublicProof');
    expect(validation.valid).toBe(true);
  });

  it('serves valid OpenAPI 3.1.0 document from /openapi.json', async () => {
    const res = await getOpenApi();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.openapi).toBe('3.1.0');
    expect(json.info.title).toBe('StellarHacks Public API');
  });
});
