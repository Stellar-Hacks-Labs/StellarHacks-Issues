import { describe, expect, it } from "vitest";

import { createHealthTracker, type ServiceHealth } from "../src/health.js";

/**
 * Every service reports the same shape so an operator can read any of them.
 */
describe("uniform health shape", () => {
  it("exposes service, ok, lastSuccessfulTick, lag, lastError and checkedAt", () => {
    const health = createHealthTracker("sealer");
    health.noteSuccess(new Date("2026-11-24T12:00:00.000Z"));
    health.setLag(2);

    const report: ServiceHealth = health.report();

    expect(report).toEqual({
      service: "sealer",
      ok: true,
      lastSuccessfulTick: "2026-11-24T12:00:00.000Z",
      lag: 2,
      lastError: null,
      checkedAt: expect.any(String),
    });
  });

  it("marks the service unhealthy after an error without inventing a success", () => {
    const health = createHealthTracker("clock");
    health.noteError(new Error("rpc timed out"));

    const report = health.report();

    expect(report.ok).toBe(false);
    expect(report.lastSuccessfulTick).toBeNull();
    expect(report.lastError).toBe("rpc timed out");
  });
});
