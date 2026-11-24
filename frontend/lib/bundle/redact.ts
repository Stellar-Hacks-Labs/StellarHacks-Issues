/**
 * Strip anything a sealed window must not leak into an archive.
 *
 * The durable log the bundle reads from is public, so ciphertext should never
 * arrive here. The strip still runs, because a fixture or a future collector
 * that pulled the sealed tables by mistake would otherwise ship the plaintext
 * or the AGE envelope in a file somebody downloads and keeps forever.
 */

const SEALED_KEYS = new Set([
  "ciphertext",
  "tlock_round",
  "tlock_commitment",
  "tlockRound",
  "tlockCommitment",
]);

/**
 * Keys that only make sense beside a still-sealed envelope.
 *
 * Once a scorecard or ballot has been revealed on chain the values live in the
 * reveal events, not in these columns, so dropping them from a pre-reveal row
 * loses nothing a verifier needs.
 */
const PRE_REVEAL_KEYS = new Set(["scores", "choices", "feedback"]);

export function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value !== null && typeof value === "object") {
    return redactRecord(value as Record<string, unknown>);
  }

  return value;
}

export function redactRecord(row: Record<string, unknown>): Record<string, unknown> {
  const sealed = Object.keys(row).some((key) => SEALED_KEYS.has(key));

  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (SEALED_KEYS.has(key)) {
      continue;
    }

    if (sealed && PRE_REVEAL_KEYS.has(key)) {
      continue;
    }

    out[key] = redactValue(value);
  }

  return out;
}
