import { db } from "./supabase.js";
import { holes, merge, type LedgerRange } from "./ranges.js";

/**
 * Finding and recording the ledger ranges nobody scanned.
 *
 * Decision 22 makes `chain_events` the durable log. A cursor ahead of what was
 * actually read is a silent hole in that log: the next restart trusts the
 * cursor and never looks again. Detecting the hole is what makes recovery a
 * command rather than a hope.
 */

export type GapReason = "missing_coverage" | "behind_retention";

export interface DetectedGap extends LedgerRange {
  reason: GapReason;
}

export interface GapRecord extends DetectedGap {
  contract_id: string;
  detected_at: string;
  resolved_at: string | null;
}

export interface GapScanInput {
  /** Inclusive ranges this process (or a fixture) actually covered. */
  covered: readonly LedgerRange[];
  /** How far the cursor claims the scan has reached. */
  cursor: number;
  /** Oldest ledger RPC still serves. Zero means the node was not asked. */
  oldestRpc: number;
  /**
   * First ledger the cover is expected to start from.
   *
   * Defaults to the earliest covered ledger, so a contract that began mid
   * window is not reported as gapped for everything before it existed.
   */
  origin?: number;
}

/**
 * The holes between what was covered and what the cursor claims, plus the
 * irreparable stretch behind the RPC retention window.
 */
export function detectGaps(input: GapScanInput): DetectedGap[] {
  const covered = merge(input.covered);
  const found: DetectedGap[] = [];

  if (input.cursor > 0 && input.oldestRpc > 0 && input.cursor < input.oldestRpc) {
    const from = input.cursor + 1;
    const to = input.oldestRpc - 1;

    if (to >= from) {
      found.push({ from, to, reason: "behind_retention" });
    }
  }

  if (covered.length === 0 || input.cursor <= 0) {
    return found;
  }

  const origin = input.origin ?? covered[0]!.from;
  let spanTo = input.cursor;

  /*
    When the cursor is stranded behind retention, the missing_coverage check
    stays inside what we still hold. The behind_retention gap above already
    names the irreparable stretch; restating it here would double-count.
  */
  if (input.oldestRpc > 0 && input.cursor < input.oldestRpc) {
    spanTo = covered[covered.length - 1]!.to;
  }

  if (spanTo >= origin) {
    for (const hole of holes({ from: origin, to: spanTo }, covered)) {
      found.push({ ...hole, reason: "missing_coverage" });
    }
  }

  return found;
}

/**
 * Writes detected gaps for one contract.
 *
 * Upserts on the natural key so a second detection of the same hole is a no
 * change rather than a growing pile of identical rows. Resolving a gap is a
 * separate write after a successful re-ingest.
 */
export async function recordGaps(contract: string, gaps: readonly DetectedGap[]): Promise<number> {
  if (gaps.length === 0) {
    return 0;
  }

  const rows = gaps.map((gap) => ({
    contract_id: contract,
    from_ledger: gap.from,
    to_ledger: gap.to,
    reason: gap.reason,
    detected_at: new Date().toISOString(),
    resolved_at: null,
  }));

  const { error } = await db.from("indexer_gaps").upsert(rows, {
    onConflict: "contract_id,from_ledger,to_ledger,reason",
  });

  if (error !== null) {
    throw new Error(`could not record gaps for ${contract}: ${error.message}`);
  }

  return rows.length;
}

/** Open gaps still waiting on a re-ingest. */
export async function openGaps(contract: string): Promise<GapRecord[]> {
  const { data, error } = await db
    .from("indexer_gaps")
    .select("contract_id, from_ledger, to_ledger, reason, detected_at, resolved_at")
    .eq("contract_id", contract)
    .is("resolved_at", null)
    .order("from_ledger", { ascending: true });

  if (error !== null) {
    throw new Error(`could not read gaps for ${contract}: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    contract_id: String(row.contract_id),
    from: Number(row.from_ledger),
    to: Number(row.to_ledger),
    reason: row.reason as GapReason,
    detected_at: String(row.detected_at),
    resolved_at: row.resolved_at === null ? null : String(row.resolved_at),
  }));
}

/** Marks every gap wholly inside a successfully re-ingested range as resolved. */
export async function resolveGapsInside(contract: string, range: LedgerRange): Promise<number> {
  const open = await openGaps(contract);
  const now = new Date().toISOString();
  let resolved = 0;

  for (const gap of open) {
    if (gap.from >= range.from && gap.to <= range.to) {
      const { error } = await db
        .from("indexer_gaps")
        .update({ resolved_at: now })
        .eq("contract_id", contract)
        .eq("from_ledger", gap.from)
        .eq("to_ledger", gap.to)
        .eq("reason", gap.reason)
        .is("resolved_at", null);

      if (error !== null) {
        throw new Error(`could not resolve gap ${gap.from}-${gap.to}: ${error.message}`);
      }

      resolved += 1;
    }
  }

  return resolved;
}
