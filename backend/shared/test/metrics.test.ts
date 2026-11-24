import { describe, expect, it } from "vitest";

import { COUNTERS, createMetrics } from "../src/metrics.js";

/**
 * Counters increment for each documented event an operator cares about.
 */
describe("operator counters", () => {
  it("starts at zero for every documented counter", () => {
    const metrics = createMetrics();

    expect(metrics.snapshot()).toEqual({
      events_ingested: 0,
      transitions_submitted: 0,
      scorecards_accepted: 0,
      scorecards_rejected: 0,
      reviews_completed: 0,
    });
    expect(COUNTERS).toContain("events_ingested");
  });

  it("increments events ingested, transitions, scorecards and reviews", () => {
    const metrics = createMetrics();

    metrics.increment("events_ingested", 4);
    metrics.increment("transitions_submitted");
    metrics.increment("scorecards_accepted");
    metrics.increment("scorecards_rejected", 2);
    metrics.increment("reviews_completed", 3);

    expect(metrics.get("events_ingested")).toBe(4);
    expect(metrics.get("transitions_submitted")).toBe(1);
    expect(metrics.get("scorecards_accepted")).toBe(1);
    expect(metrics.get("scorecards_rejected")).toBe(2);
    expect(metrics.get("reviews_completed")).toBe(3);
  });
});
