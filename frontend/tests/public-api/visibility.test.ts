import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getResults } from '../../app/api/v1/hackathons/[slug]/results/route';
import { GET as getProjects } from '../../app/api/v1/hackathons/[slug]/projects/route';
import { assertNoPrivateFields } from '../../lib/public-api/visibility';
import { resetRateLimits } from '../../lib/public-api/rate-limit';

describe('Public API visibility & privacy guarantees', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('never reveals scores when hackathon is active or voting is unsealed', async () => {
    const res = await getResults(
      new Request('http://localhost/api/v1/hackathons/stellar-wave-11/results'),
      { params: Promise.resolve({ slug: 'stellar-wave-11' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    for (const ranking of json.rankings) {
      expect(ranking.score).toBeNull();
      expect(ranking.scoreRevealed).toBe(false);
    }
  });

  it('never leaks private profile fields in project member responses', async () => {
    const res = await getProjects(
      new Request('http://localhost/api/v1/hackathons/stellar-wave-11/projects'),
      { params: Promise.resolve({ slug: 'stellar-wave-11' }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    // Verify deeply using strict assertNoPrivateFields scanner
    expect(() => assertNoPrivateFields(json)).not.toThrow();

    for (const project of json.data) {
      for (const member of project.members) {
        expect(member.email).toBeUndefined();
        expect(member.phone).toBeUndefined();
        expect(member.password).toBeUndefined();
        expect(member.token).toBeUndefined();
        expect(member.session).toBeUndefined();
      }
    }
  });
});
