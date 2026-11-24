/**
 * Structured disagreement between a recomputed value and a published one.
 *
 * Every check the verifier runs ends here so a report can name what failed
 * without each module inventing its own shape for "not equal".
 */

export interface Check {
  /** Stable name, for example `constitution.hash` or `ranking.payments`. */
  name: string;
  /** Whether the recomputed and published values agree. */
  ok: boolean;
  /** What this package derived from public inputs. */
  expected: unknown;
  /** What the chain (or fixture) published. */
  actual: unknown;
  /** Optional human detail when equality is more than JSON stringify. */
  detail?: string;
}

/**
 * One named comparison.
 *
 * Callers that need domain-specific equality pass `equal`; the default is a
 * stable JSON stringify so digests, rankings and payout tables share one path.
 */
export function compareCheck(
  name: string,
  expected: unknown,
  actual: unknown,
  equal: (left: unknown, right: unknown) => boolean = deepEqual,
): Check {
  const ok = equal(expected, actual);

  return {
    name,
    ok,
    expected,
    actual,
    detail: ok ? undefined : `${name} disagrees`,
  };
}

/** Every failed check, in the order they were recorded. */
export function disagreements(checks: readonly Check[]): Check[] {
  return checks.filter((check) => !check.ok);
}

/** Whether every recorded check passed. */
export function allOk(checks: readonly Check[]): boolean {
  return checks.every((check) => check.ok);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return stable(left) === stable(right);
}

function stable(value: unknown): string {
  if (typeof value === "bigint") {
    return `bigint:${value.toString()}`;
  }

  if (value instanceof Uint8Array) {
    return `bytes:${Buffer.from(value).toString("hex")}`;
  }

  if (Buffer.isBuffer(value)) {
    return `bytes:${value.toString("hex")}`;
  }

  if (Array.isArray(value)) {
    return `[${value.map(stable).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return `{${entries.map(([key, entry]) => `${key}:${stable(entry)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}
