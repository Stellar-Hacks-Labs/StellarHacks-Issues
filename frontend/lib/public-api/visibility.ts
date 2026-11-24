/**
 * What this API will not serve, enforced in one place.
 *
 * Two promises, and both are the kind that are kept by construction rather than
 * by remembering:
 *
 *   a score that has not been revealed never appears, because before the reveal
 *   the scorecards are sealed and a number served here would be a number
 *   nobody is supposed to have yet;
 *
 *   a private profile field never appears, because this API lists events,
 *   projects and results — no part of its purpose needs somebody's email, their
 *   country or their account identity.
 *
 * Written as an allow list. A denial list is a list somebody has to remember to
 * add to when a column arrives, and the column that gets forgotten is the one
 * that leaks.
 */

/** Phase five is the reveal, in the contract's own numbering. */
export const REVEAL_PHASE = 5;

export function revealed(phase: number | null): boolean {
  return phase !== null && phase >= REVEAL_PHASE;
}

/** The only columns of a project this API publishes. */
export const PROJECT_FIELDS = [
  "team",
  "title",
  "summary",
  "repositoryUrl",
  "demoVideoUrl",
  "liveUrl",
  "track",
  "submissionDigest",
  "submittedAtLedger",
  "disqualified",
] as const;

/** The only columns of a placement this API publishes, and the ones held back until the reveal. */
export const PLACEMENT_FIELDS = [
  "rank",
  "team",
  "finalScore",
  "judgeAverage",
  "community",
  "decidedBy",
  "paidAmount",
  "paidTxHash",
] as const;

export const SCORE_FIELDS = ["finalScore", "judgeAverage", "community", "decidedBy"] as const;

/**
 * Fields that must never reach this API, whatever a future read asks a table
 * for.
 *
 * Checked rather than trusted: `assertNoPrivateFields` is called by the
 * contract tests against every shaped payload, so a column added to a select
 * and forwarded by accident fails a test instead of appearing in an answer.
 */
export const FORBIDDEN_FIELDS = [
  "email",
  "profile_id",
  "profileId",
  "country",
  "countryCode",
  "identityKey",
  "identity_key",
  "walletAddress",
  "wallet_address",
  "scores",
  "ciphertext",
  "tlock_round",
  "tlockRound",
  "signature",
  "leaf",
] as const;

export function privateFieldsIn(value: unknown, at = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => privateFieldsIn(entry, `${at}[${index}]`));
  }
  if (value === null || typeof value !== "object") {
    return [];
  }

  const found: string[] = [];

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if ((FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      found.push(`${at}.${key}`);
    }
    found.push(...privateFieldsIn(entry, `${at}.${key}`));
  }

  return found;
}

/**
 * A placement with its scores removed, for an event that has not revealed.
 *
 * The placing itself is not a secret once the contract has ranked — the ranking
 * is on chain — but the numbers behind it are sealed until the reveal, so they
 * are dropped and the track says `revealed: false` beside them rather than the
 * API serving a zero that reads like a score.
 */
export function withoutScores<Placement extends Record<string, unknown>>(placement: Placement): Placement {
  const kept = { ...placement };

  for (const field of SCORE_FIELDS) {
    if (field in kept) {
      (kept as Record<string, unknown>)[field] = null;
    }
  }

  return kept;
}
