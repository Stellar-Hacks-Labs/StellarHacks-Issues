import { describe, it, expect } from 'vitest';
import { OPENAPI_SPEC, validateAgainstSchema } from './openapi';

describe('OpenAPI document & schema validation', () => {
  it('exports valid OpenAPI 3.1.0 document with all required paths', () => {
    expect(OPENAPI_SPEC.openapi).toBe('3.1.0');
    expect(OPENAPI_SPEC.info.title).toBe('StellarHacks Public API');
    expect(OPENAPI_SPEC.paths['/hackathons']).toBeDefined();
    expect(OPENAPI_SPEC.paths['/hackathons/{slug}']).toBeDefined();
    expect(OPENAPI_SPEC.paths['/hackathons/{slug}/projects']).toBeDefined();
    expect(OPENAPI_SPEC.paths['/hackathons/{slug}/results']).toBeDefined();
    expect(OPENAPI_SPEC.paths['/hackathons/{slug}/proof']).toBeDefined();
    expect(OPENAPI_SPEC.paths['/openapi.json']).toBeDefined();
  });

  it('validates conforming objects against OpenAPI schemas', () => {
    const validHackathon = {
      slug: 'stellar-defi-2026',
      contractId: 'C1234567890123456789012345678901234567890123456789012345',
      name: 'Stellar DeFi 2026',
      tags: ['defi', 'amm'],
      phase: 'live',
      createdAt: '2026-06-01T00:00:00Z',
    };

    const res = validateAgainstSchema(validHackathon, 'PublicHackathon');
    expect(res.valid).toBe(true);
    expect(res.missing).toHaveLength(0);
  });

  it('detects missing required fields against OpenAPI schemas', () => {
    const invalidHackathon = {
      slug: 'stellar-defi-2026',
      // missing contractId, name, tags, phase, createdAt
    };

    const res = validateAgainstSchema(invalidHackathon, 'PublicHackathon');
    expect(res.valid).toBe(false);
    expect(res.missing).toContain('contractId');
    expect(res.missing).toContain('name');
  });
});
