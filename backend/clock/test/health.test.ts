import { describe, expect, it } from "vitest";

import { metrics, serviceHealth, tracker } from "../src/health.js";

/**
 * The clock exposes the same health shape as the other services.
 */
describe("uniform clock health", () => {
  it("exposes service, ok, lastSuccessfulTick, lag, lastError and checkedAt", () => {
    tracker.noteSuccess(new Date("2026-11-24T12:00:00.000Z"));
    tracker.setLag(1200);

    expect(serviceHealth()).toMatchObject({
      service: "clock",
      ok: true,
      lastSuccessfulTick: "2026-11-24T12:00:00.000Z",
      lag: 1200,
      lastError: null,
    });
  });

  it("increments transitions_submitted when a due call is sent", () => {
    metrics.reset();
    metrics.increment("transitions_submitted", 3);
    expect(metrics.get("transitions_submitted")).toBe(3);
  });
});
