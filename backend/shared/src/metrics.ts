/**
 * In-memory atomic counters for backend observability:
 * - events_ingested
 * - transitions_submitted
 * - scorecards_accepted
 * - scorecards_rejected
 * - reviews_completed
 */

export type MetricName =
  | "events_ingested"
  | "transitions_submitted"
  | "scorecards_accepted"
  | "scorecards_rejected"
  | "reviews_completed";

class MetricsCollector {
  private readonly counters = new Map<MetricName, number>([
    ["events_ingested", 0],
    ["transitions_submitted", 0],
    ["scorecards_accepted", 0],
    ["scorecards_rejected", 0],
    ["reviews_completed", 0],
  ]);

  increment(metric: MetricName, by = 1): number {
    const current = this.counters.get(metric) || 0;
    const next = current + by;
    this.counters.set(metric, next);
    return next;
  }

  get(metric: MetricName): number {
    return this.counters.get(metric) || 0;
  }

  getAll(): Record<MetricName, number> {
    return Object.fromEntries(this.counters.entries()) as Record<MetricName, number>;
  }

  reset(): void {
    for (const key of this.counters.keys()) {
      this.counters.set(key, 0);
    }
  }
}

export const metrics = new MetricsCollector();
