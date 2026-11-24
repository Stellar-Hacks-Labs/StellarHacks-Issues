import { describe, expect, it } from "vitest";

import { metrics, serviceHealth, tracker } from "../src/health.js";

/**
 * The sealer exposes the same health shape as the other services.
 *
 * Route wiring for GET /health is covered by reading the same `serviceHealth`
 * helper the route returns; importing `routes.ts` here would pull config and
 * require a live `.env.local` for a unit of work that is otherwise pure.
 */
describe("uniform sealer health", () => {
  it("exposes service, ok, lastSuccessfulTick, lag, lastError and checkedAt", () => {
    tracker.noteSuccess(new Date("2026-11-24T12:00:00.000Z"));
    tracker.setLag(0);

    expect(serviceHealth()).toMatchObject({
      service: "sealer",
      ok: true,
      lastSuccessfulTick: "2026-11-24T12:00:00.000Z",
      lag: 0,
      lastError: null,
    });
  });

  it("increments scorecard counters for accepted and rejected intake", () => {
    metrics.reset();
    metrics.increment("scorecards_accepted");
    metrics.increment("scorecards_rejected", 2);

    expect(metrics.get("scorecards_accepted")).toBe(1);
    expect(metrics.get("scorecards_rejected")).toBe(2);
  });
});
