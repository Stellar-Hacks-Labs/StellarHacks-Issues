import { describe, it, expect, beforeEach } from "vitest";
import { metrics } from "../src/metrics.js";

describe("Observability Metrics Counters", () => {
  beforeEach(() => {
    metrics.reset();
  });

  it("increments counters accurately for documented backend events", () => {
    expect(metrics.get("events_ingested")).toBe(0);
    metrics.increment("events_ingested", 5);
    expect(metrics.get("events_ingested")).toBe(5);

    metrics.increment("transitions_submitted", 2);
    expect(metrics.get("transitions_submitted")).toBe(2);

    metrics.increment("scorecards_accepted", 10);
    expect(metrics.get("scorecards_accepted")).toBe(10);

    metrics.increment("scorecards_rejected", 1);
    expect(metrics.get("scorecards_rejected")).toBe(1);

    metrics.increment("reviews_completed", 8);
    expect(metrics.get("reviews_completed")).toBe(8);
  });

  it("returns all metrics in single dictionary", () => {
    metrics.increment("events_ingested", 1);
    const all = metrics.getAll();
    expect(all.events_ingested).toBe(1);
    expect(all.scorecards_accepted).toBe(0);
  });
});
