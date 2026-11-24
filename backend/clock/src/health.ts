import {
  createHealthTracker,
  createLogger,
  createMetrics,
  type ServiceHealth,
} from "@stelhacks/shared";

/** Structured logger for the clock process. */
export const log = createLogger("clock");

/** Counters for transitions the clock actually submitted. */
export const metrics = createMetrics();

/** Uniform health for each lap over the hackathons table. */
export const tracker = createHealthTracker("clock");

export function serviceHealth(): ServiceHealth {
  return tracker.report();
}
