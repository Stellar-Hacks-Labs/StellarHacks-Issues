import { rpc } from "@stellar/stellar-sdk";

import { latestCheck } from "./consistency.js";
import { settings } from "./config.js";
import { resumeFrom } from "./cursor.js";
import { openGaps } from "./gaps.js";
import { summarizeConsistency, type HealthConsistency } from "./report.js";

const server = new rpc.Server(settings.rpcUrl);

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
 */
export async function health(contract: string): Promise<Health> {
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
