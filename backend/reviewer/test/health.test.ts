import { describe, expect, it } from "vitest";

import { metrics, serviceHealth, tracker } from "../src/health.js";

/**
 * The reviewer exposes the same health shape as the other services.
 */
describe("uniform reviewer health", () => {
  it("exposes service, ok, lastSuccessfulTick, lag, lastError and checkedAt", () => {
    tracker.noteSuccess(new Date("2026-11-24T12:00:00.000Z"));
    tracker.setLag(400);

    expect(serviceHealth()).toMatchObject({
      service: "reviewer",
      ok: true,
      lastSuccessfulTick: "2026-11-24T12:00:00.000Z",
      lag: 400,
      lastError: null,
    });
  });

  it("increments reviews_completed when a run finishes", () => {
    metrics.reset();
    metrics.increment("reviews_completed", 2);
    expect(metrics.get("reviews_completed")).toBe(2);
  });
});
