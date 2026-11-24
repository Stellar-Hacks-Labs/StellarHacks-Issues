/**
 * Turn collected parts into the exact bytes that go into the zip.
 *
 * Sorted keys and a trailing newline on every JSONL line keep two exports of
 * the same source rows byte-identical. Timestamps that came from the wall clock
 * never enter these bytes; the freeze point is the data itself.
 */

import { redactValue } from "./redact";

/** Stable JSON: keys sorted at every object, no insignificant whitespace. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(redactValue(value)));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeys(record[key]);
    }

    return sorted;
  }

  return value;
}

/** One JSON object per line, each line terminated with LF. */
export function toJsonl(rows: readonly unknown[]): string {
  if (rows.length === 0) {
    return "";
  }

  return rows.map((row) => stableStringify(row)).join("\n") + "\n";
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
