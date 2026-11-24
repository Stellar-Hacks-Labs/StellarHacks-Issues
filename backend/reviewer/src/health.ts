import {
  createHealthTracker,
  createLogger,
  createMetrics,
  type ServiceHealth,
} from "@stelhacks/shared";

/** Structured logger for the AI review worker. */
export const log = createLogger("reviewer");

/** Counters for runs that finished writing every review. */
export const metrics = createMetrics();

/** Uniform health for each drain of the review queue. */
export const tracker = createHealthTracker("reviewer");

export function serviceHealth(): ServiceHealth {
  return tracker.report();
}
