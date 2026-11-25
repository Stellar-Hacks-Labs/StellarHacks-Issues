import type { EventRecords } from "../../../lib/credentials";

/**
 * What the route's own tests stand on.
 *
 * Separate from `lib/credentials/fixtures.ts` on purpose: that file holds the
 * records a claim is built from, and these are the request shapes and the
 * replies this route owes — the two change for different reasons, and a test
 * that reached across would couple them.
 */

export const SUBJECT = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
export const SIGNING_SEED = Buffer.alloc(32, 9);

/** A request body as the export control sends one. */
export function asking(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/credentials", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** One settled event, enough for a placement claim. */
export function records(): EventRecords[] {
  return [
    {
      contract: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
      slug: "a-finished-event",
      phase: 7,
      constitutionHash: "cd".repeat(32),
      scoreRoot: "22".repeat(32),
      placements: [{ track: "ai", rank: 1, team: 3, finalScore: 9_000 }],
      teams: [3],
      submissions: [{ team: 3, digest: "11".repeat(32) }],
      payments: [{ track: "ai", rank: 1, kind: 0, txHash: "ab".repeat(32) }],
    },
  ];
}
