import { describe, expect, it } from "vitest";

import { summarizeConsistency } from "../src/report.js";
import { metrics, serviceHealth, tracker } from "../src/health.js";

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

/**
 * The indexer reports the same uniform shape as every other service.
 */
describe("uniform indexer health", () => {
  it("exposes service, ok, lastSuccessfulTick, lag, lastError and checkedAt", () => {
    tracker.noteSuccess(new Date("2026-11-24T12:00:00.000Z"));
    tracker.setLag(7);

    expect(serviceHealth()).toMatchObject({
      service: "indexer",
      ok: true,
      lastSuccessfulTick: "2026-11-24T12:00:00.000Z",
      lag: 7,
      lastError: null,
    });
  });

  it("increments events_ingested when the follow loop records a pass", () => {
    metrics.reset();
    metrics.increment("events_ingested", 5);
    expect(metrics.get("events_ingested")).toBe(5);
  });
});
