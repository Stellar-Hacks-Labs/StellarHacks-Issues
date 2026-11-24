/**
 * Strip secrets from values that are about to be logged.
 *
 * Operators need fields; they do not need the service role key that sat next
 * to them. Matching is on the key name, because values look alike and a seed
 * that slipped into a message under `clockSecret` must not survive as a string
 * that happened to pass a value-shaped filter.
 */

const REDACTED = "[redacted]";

/**
 * Key names that hold material nobody should find in a log file.
 *
 * Broad on purpose: `serviceRoleKey`, `SUPABASE_SERVICE_ROLE_KEY`, `secret`,
 * `seed`, and wallet seeds named `CLOCK_SECRET_KEY` all match. A false positive
 * that redacts an unrelated "key" field is cheaper than a false negative that
 * prints a signing seed.
 */
const SENSITIVE =
  /secret|seed|password|passwd|token|authorization|api[_-]?key|private[_-]?key|service[_-]?role/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE.test(key);
}

/** Deep-copy `value`, replacing sensitive keys with a fixed marker. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redact(child);
    }

    return out;
  }

  return value;
}

export const REDACTION_MARKER = REDACTED;
