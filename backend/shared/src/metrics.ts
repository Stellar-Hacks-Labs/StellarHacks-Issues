/**
 * Named counters an operator can read without a hosted metrics backend.
 *
 * The names are the contract with the docs: each one maps to one event that
 * already happened in a service, and tests assert the increment rather than a
 * side channel.
 */

export const COUNTERS = [
  "events_ingested",
  "transitions_submitted",
  "scorecards_accepted",
  "scorecards_rejected",
  "reviews_completed",
] as const;

export type CounterName = (typeof COUNTERS)[number];

export type MetricsSnapshot = Record<CounterName, number>;

export interface Metrics {
  increment(name: CounterName, by?: number): void;
  get(name: CounterName): number;
  snapshot(): MetricsSnapshot;
  reset(): void;
}

/** Process-local counters. Reset only in tests. */
export function createMetrics(): Metrics {
  const counts = empty();

  return {
    increment(name, by = 1) {
      counts[name] += by;
    },
    get(name) {
      return counts[name];
    },
    snapshot() {
      return { ...counts };
    },
    reset() {
      for (const name of COUNTERS) {
        counts[name] = 0;
      }
    },
  };
}

function empty(): MetricsSnapshot {
  return {
    events_ingested: 0,
    transitions_submitted: 0,
    scorecards_accepted: 0,
    scorecards_rejected: 0,
    reviews_completed: 0,
  };
}
