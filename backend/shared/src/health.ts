/**
 * The health shape every long lived service reports.
 *
 * Same fields, same names, so an operator reading four processes does not have
 * to remember four dialects. `lag` is service-specific in unit (ledgers for the
 * indexer, milliseconds since the last successful tick for the others) but the
 * field is always present and always a non-negative number.
 */

export interface ServiceHealth {
  service: string;
  ok: boolean;
  /** ISO timestamp of the last tick that finished without error, or null. */
  lastSuccessfulTick: string | null;
  /** How far behind the service is, in its own unit. Zero means caught up. */
  lag: number;
  /** The most recent error message, or null when the last tick succeeded. */
  lastError: string | null;
  /** When this report was produced. */
  checkedAt: string;
}

export interface HealthTracker {
  /** Record that a tick finished cleanly. Clears `lastError`. */
  noteSuccess(at?: Date): void;
  /** Record that a tick failed. Does not move `lastSuccessfulTick`. */
  noteError(error: unknown, at?: Date): void;
  /** Set how far behind the service currently is. */
  setLag(lag: number): void;
  /** The uniform report. */
  report(): ServiceHealth;
}

function asMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/** Mutable tracker one service keeps for its own process lifetime. */
export function createHealthTracker(service: string): HealthTracker {
  let lastSuccessfulTick: string | null = null;
  let lastError: string | null = null;
  let lag = 0;

  return {
    noteSuccess(at = new Date()) {
      lastSuccessfulTick = at.toISOString();
      lastError = null;
    },
    noteError(error, at = new Date()) {
      lastError = asMessage(error);
      // `at` is accepted so callers that already have a clock can stay consistent;
      // it is not stored, because a failed tick must not look like a success.
      void at;
    },
    setLag(next) {
      lag = Math.max(0, next);
    },
    report() {
      return {
        service,
        ok: lastError === null && lastSuccessfulTick !== null,
        lastSuccessfulTick,
        lag,
        lastError,
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
