import {
  createHealthTracker,
  createLogger,
  createMetrics,
  type ServiceHealth,
} from "@stelhacks/shared";

/** Structured logger for the sealed collection service. */
export const log = createLogger("sealer");

/** Counters for accepted and rejected scorecards. */
export const metrics = createMetrics();

/** Uniform health for the intake process and the background rounds loop. */
export const tracker = createHealthTracker("sealer");

/** Snapshot an operator can read from GET /health. */
export function serviceHealth(): ServiceHealth {
  return tracker.report();
}
