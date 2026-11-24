import {
  createHealthTracker,
  createLogger,
  createMetrics,
  type ServiceHealth,
} from "@stelhacks/shared";

import type { HealthConsistency } from "./report.js";

/** Structured logger for the indexer process. */
export const log = createLogger("indexer");

/** Counters the follow loop and ingest path share. */
export const metrics = createMetrics();

/** Uniform health tracker; lag is filled from the chain-facing report. */
export const tracker = createHealthTracker("indexer");

export interface Health {
  cursor: number;
  latest: number;
  /** How many ledgers behind the head the indexer is. */
  lag: number;
  /**
   * Whether the cursor has fallen out of the window RPC still serves.
   *
   * This is the failure that cannot be walked off. Every other kind of lag
   * closes by running; once the cursor is older than the oldest ledger RPC
   * holds, the events in between are simply not available from here any more
   * and the gap needs an archive rather than patience.
   */
  strandedBehindRetention: boolean;
  /** Open gap rows still waiting on a re-ingest. */
  openGapCount: number;
  /** Newest consistency check, if one has ever run for this contract. */
  consistency: HealthConsistency;
}

/**
 * How far behind the indexer is, in ledgers, plus the latest recovery signals.
 *
 * Reported in ledgers rather than seconds because ledgers are what the cursor
 * counts and what the gap is measured in; converting to a duration would put a
 * guess about ledger timing between the number and the thing it describes.
 *
 * Chain and database clients load inside the call so importing this module for
 * the uniform tracker and logger does not demand a configured environment.
 */
export async function health(contract: string): Promise<Health> {
  const { rpc } = await import("@stellar/stellar-sdk");
  const { latestCheck } = await import("./consistency.js");
  const { settings } = await import("./config.js");
  const { resumeFrom } = await import("./cursor.js");
  const { openGaps } = await import("./gaps.js");
  const { summarizeConsistency } = await import("./report.js");

  const server = new rpc.Server(settings.rpcUrl);
  const [cursor, node, gaps, check] = await Promise.all([
    resumeFrom(contract),
    server.getHealth(),
    openGaps(contract),
    latestCheck(contract),
  ]);

  return {
    cursor,
    latest: node.latestLedger,
    lag: Math.max(0, node.latestLedger - cursor),
    strandedBehindRetention: cursor > 0 && cursor < node.oldestLedger,
    openGapCount: gaps.length,
    consistency: summarizeConsistency(
      check?.checked_at ?? null,
      check === null
        ? null
        : { ok: check.ok, mismatches: check.mismatches },
    ),
  };
}

/**
 * The uniform shape every service exposes, with indexer lag in ledgers.
 *
 * Chain-specific detail stays on `health(contract)`; this is what an operator
 * compares across indexer, sealer, clock and reviewer without learning four
 * dialects.
 */
export function serviceHealth(): ServiceHealth {
  return tracker.report();
}
