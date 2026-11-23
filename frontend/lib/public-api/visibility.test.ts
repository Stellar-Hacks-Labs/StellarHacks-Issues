import { describe, it, expect } from 'vitest';
import {
  sanitizeMember,
  sanitizeProject,
  sanitizeRankings,
  assertNoPrivateFields,
} from './visibility';

describe('visibility & redaction defense', () => {
  it('strips private profile fields (email, session, internal tokens) from member objects', () => {
    const raw = {
      address: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
      captain: true,
      displayName: 'Bob Builder',
      username: 'bob',
      avatarUrl: 'https://example.com/bob.png',
      email: 'bob@private.org',
      session_token: 'secret-token-xyz',
      userId: 'usr-12345',
      kyc: true,
    };

    const clean = sanitizeMember(raw);
    expect(clean).toEqual({
      address: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
      captain: true,
      displayName: 'Bob Builder',
      username: 'bob',
      avatarUrl: 'https://example.com/bob.png',
    });

    expect((clean as Record<string, unknown>).email).toBeUndefined();
    expect((clean as Record<string, unknown>).session_token).toBeUndefined();
    expect(() => assertNoPrivateFields(clean)).not.toThrow();
  });

  it('redacts unrevealed scores to null when scoreRevealed is false or forceUnrevealed is true', () => {
    const rawRankings = [
      {
        rank: 1,
        teamId: 10,
        teamName: 'Winner One',
        projectTitle: 'Smart Project',
        prize: '10000 XLM',
        score: 98.5,
        scoreRevealed: false, // Sealed
      },
      {
        rank: 2,
        teamId: 11,
        teamName: 'Runner Up',
        projectTitle: 'Cool Project',
        prize: '5000 XLM',
        score: 92.0,
        scoreRevealed: true, // Revealed
      },
    ];

    const sanitized = sanitizeRankings(rawRankings);
    expect(sanitized[0].score).toBeNull();
    expect(sanitized[0].scoreRevealed).toBe(false);

    expect(sanitized[1].score).toBe(92.0);
    expect(sanitized[1].scoreRevealed).toBe(true);

    // If forced unrevealed
    const forced = sanitizeRankings(rawRankings, true);
    expect(forced[1].score).toBeNull();
    expect(forced[1].scoreRevealed).toBe(false);
  });

  it('assertNoPrivateFields throws if forbidden sensitive keys exist', () => {
    const leaked = {
      title: 'Project Alpha',
      user: {
        name: 'John',
        email: 'john@secret.com',
      },
    };

    expect(() => assertNoPrivateFields(leaked)).toThrow(/Private field 'email' detected/);
  });
});
