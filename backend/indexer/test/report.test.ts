import { describe, expect, it } from "vitest";

import { formatConsistency, formatGaps, summarizeConsistency } from "../src/report.js";

describe("formatting gap and consistency findings", () => {
  it("says so when there are no gaps", () => {
    expect(formatGaps([])).toBe("no gaps");
  });

  it("lists each gap with its reason", () => {
    expect(
      formatGaps([
        { from: 10, to: 12, reason: "missing_coverage" },
        { from: 1, to: 5, reason: "behind_retention" },
      ]),
    ).toBe("10-12 (missing_coverage), 1-5 (behind_retention)");
  });

  it("summarises an unchecked contract as null rather than ok", () => {
    expect(summarizeConsistency(null, null)).toEqual({
      checkedAt: null,
      ok: null,
      mismatchCount: 0,
    });
  });

  it("carries the mismatch count into the health summary", () => {
    expect(
      summarizeConsistency("2026-11-21T01:00:00.000Z", {
        ok: false,
        mismatches: [
          {
            table: "hackathon_state",
            key: "state",
            field: "phase",
            projected: 4,
            onChain: 5,
          },
        ],
      }),
    ).toEqual({
      checkedAt: "2026-11-21T01:00:00.000Z",
      ok: false,
      mismatchCount: 1,
    });
  });

  it("says projections match when the report is clean", () => {
    expect(formatConsistency({ ok: true, mismatches: [] })).toBe(
      "projections match contract state",
    );
  });
});
