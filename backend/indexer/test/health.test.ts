import { describe, expect, it } from "vitest";

import { summarizeConsistency } from "../src/report.js";

/**
 * Health surfaces the latest consistency summary.
 *
 * The full health() call hits RPC and Postgres; the property under defence here
 * is that a stored check collapses into the fields the follow loop prints.
 */
describe("health consistency summary", () => {
  it("exposes ok and mismatchCount for the follow loop to print", () => {
    const summary = summarizeConsistency("2026-11-21T01:00:00.000Z", {
      ok: true,
      mismatches: [],
    });

    expect(summary.ok).toBe(true);
    expect(summary.mismatchCount).toBe(0);
    expect(summary.checkedAt).toBe("2026-11-21T01:00:00.000Z");
  });
});
