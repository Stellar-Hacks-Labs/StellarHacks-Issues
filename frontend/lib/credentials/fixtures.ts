import type { EventRecords } from "./build";

/**
 * Records for this side's tests, written here rather than read from
 * `fixtures/credentials/`.
 *
 * The committed fixtures are signed credentials: they pin the format and the
 * signature between the SDK and this application, and `sign.test.ts`
 * reproduces their signatures to prove the two agree. These are the inputs
 * *before* a credential exists — what a page read for an event — and they
 * belong to this side alone.
 */

export const SUBJECT = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
export const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
export const OTHER_CONTRACT = "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE";
/** The seed the committed fixtures were signed with: 32 bytes of 0x07. */
export const FIXTURE_SEED = Buffer.alloc(32, 7);
export const TX_HASH = "ab".repeat(32);
export const CONSTITUTION_HASH = "cd".repeat(32);
export const SCORE_ROOT = "22".repeat(32);
export const SUBMISSION_DIGEST = "11".repeat(32);

/** A settled event where the subject's team took first place in one track. */
export function settledEvent(): EventRecords {
  return {
    contract: CONTRACT,
    slug: "a-finished-event",
    phase: 7,
    constitutionHash: CONSTITUTION_HASH,
    scoreRoot: SCORE_ROOT,
    placements: [
      { track: "ai", rank: 1, team: 3, finalScore: 9_000 },
      { track: "ai", rank: 2, team: 5, finalScore: 7_000 },
      { track: "tooling", rank: 1, team: 8, finalScore: 8_000 },
    ],
    teams: [3],
    submissions: [{ team: 3, digest: SUBMISSION_DIGEST }],
    payments: [
      { track: "ai", rank: 1, kind: 0, txHash: TX_HASH },
      { track: "ai", rank: 2, kind: 1, txHash: "ff".repeat(32) },
    ],
  };
}

/** The same shape mid judging: the ranking exists and has not been revealed. */
export function judgingEvent(): EventRecords {
  return { ...settledEvent(), contract: OTHER_CONTRACT, slug: "an-event", phase: 4 };
}

/** An event the subject joined and did not place in. */
export function joinedEvent(): EventRecords {
  return {
    contract: OTHER_CONTRACT,
    slug: "an-event",
    phase: 7,
    constitutionHash: CONSTITUTION_HASH,
    scoreRoot: SCORE_ROOT,
    placements: [{ track: "ai", rank: 1, team: 9, finalScore: 9_500 }],
    teams: [4],
    submissions: [{ team: 4, digest: SUBMISSION_DIGEST }],
    payments: [],
  };
}

/** An event where the subject judged rather than built: no team at all. */
export function judgedEvent(): EventRecords {
  return { ...joinedEvent(), teams: [], submissions: [] };
}
