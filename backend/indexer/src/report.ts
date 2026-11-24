import type { ConsistencyReport, FieldMismatch } from "./compare.js";
import type { DetectedGap } from "./gaps.js";

/**
 * Turning structured findings into something a person or a health probe can
 * read in one glance.
 */

export interface HealthConsistency {
  checkedAt: string | null;
  ok: boolean | null;
  mismatchCount: number;
}

export function formatGaps(gaps: readonly DetectedGap[]): string {
  if (gaps.length === 0) {
    return "no gaps";
  }

  return gaps
    .map((gap) => `${gap.from}-${gap.to} (${gap.reason})`)
    .join(", ");
}

export function formatMismatch(mismatch: FieldMismatch): string {
  return `${mismatch.table}.${mismatch.key}.${mismatch.field}: projected=${JSON.stringify(mismatch.projected)} on-chain=${JSON.stringify(mismatch.onChain)}`;
}

export function formatConsistency(report: ConsistencyReport): string {
  if (report.ok) {
    return "projections match contract state";
  }

  return `${report.mismatches.length} mismatch(es):\n${report.mismatches
    .map((item) => `  - ${formatMismatch(item)}`)
    .join("\n")}`;
}

export function summarizeConsistency(
  checkedAt: string | null,
  report: ConsistencyReport | null,
): HealthConsistency {
  if (report === null) {
    return { checkedAt, ok: null, mismatchCount: 0 };
  }

  return {
    checkedAt,
    ok: report.ok,
    mismatchCount: report.mismatches.length,
  };
}
