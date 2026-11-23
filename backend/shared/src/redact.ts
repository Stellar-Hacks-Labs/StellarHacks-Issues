/**
 * Redaction utility for structured logging and error outputs.
 * Ensures secret keys, service role keys, and seeds never leak into logs.
 */

const REDACTION_RULES: Array<{ pattern: RegExp; mask: string }> = [
  // Stellar secret seed: S + 55 base32 chars
  { pattern: /\bS[A-Z0-9]{55}\b/g, mask: "[REDACTED_SECRET_SEED]" },
  // JWTs / Service Role keys
  {
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    mask: "[REDACTED_JWT]",
  },
  // Supabase service_role keys or api keys
  {
    pattern: /\b(?:sbp_|sk_live_|service_role)[A-Za-z0-9_.-]{16,}\b/gi,
    mask: "[REDACTED_API_KEY]",
  },
  // Postgres/database URIs with credentials
  {
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@"'`<>]+:[^\s/@"'`<>]*@[^\s"'`<>]+/gi,
    mask: "[REDACTED_DATABASE_URL]",
  },
  // Bare 64-char hex private keys / secrets
  {
    pattern: /\b(secret|seed|private_key|privateKey|token)\s*[:=]\s*["']?([0-9a-fA-F]{64})["']?/gi,
    mask: "$1: [REDACTED_HEX_SECRET]",
  },
];

/** Redacts sensitive keys and seeds from strings. */
export function redact(input: string): string {
  if (!input) return "";
  let output = input;
  for (const { pattern, mask } of REDACTION_RULES) {
    output = output.replace(pattern, mask);
  }
  return output;
}

/** Recursively redacts sensitive keys and values from objects. */
export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return redact(obj) as unknown as T;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(secret|seed|private|token|password|auth|authorization)/i.test(k)) {
      result[k] = "[REDACTED]";
    } else {
      result[k] = redactObject(v);
    }
  }
  return result as T;
}
