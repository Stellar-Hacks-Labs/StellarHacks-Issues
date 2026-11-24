import { compare, type ConsistencyReport } from "./compare.js";
import { formatConsistency } from "./report.js";
import { db } from "./supabase.js";

/**
 * Proving the projections still match what the contract answers.
 *
 * After an outage the log may be complete and the derived tables still wrong,
 * or the other way around. This check reads both and stores the diff so health
 * can surface the latest result without re-running the RPC calls.
 *
 * State readers are loaded inside `runConsistencyCheck` so suites that only
 * exercise the report wording do not have to resolve the SDK package entry.
 */

export interface StoredConsistencyCheck {
  contract_id: string;
  checked_at: string;
  ok: boolean;
  mismatches: ConsistencyReport["mismatches"];
}

export interface ConsistencyRun {
  report: ConsistencyReport;
  checkedAt: string;
}

/**
 * Gather both sides, compare, persist, return.
 *
 * Persistence is append-only: every run leaves a row so a regression can be
 * dated. Health reads the newest one.
 */
export async function runConsistencyCheck(contract: string): Promise<ConsistencyRun> {
  const { readChainSnapshot, readProjectionSnapshot } = await import("./state-readers.js");
  const projected = await readProjectionSnapshot(contract);
  const tracks = [...new Set(projected.results.map((row) => row.track))];
  const teamIds = Object.keys(projected.submissions).map(Number);
  const onChain = await readChainSnapshot(contract, tracks, teamIds);
  const report = compare(projected, onChain);
  const checkedAt = new Date().toISOString();

  await storeCheck(contract, checkedAt, report);

  return { report, checkedAt };
}

export async function storeCheck(
  contract: string,
  checkedAt: string,
  report: ConsistencyReport,
): Promise<void> {
  const { error } = await db.from("indexer_consistency_checks").insert({
    contract_id: contract,
    checked_at: checkedAt,
    ok: report.ok,
    mismatches: report.mismatches,
  });

  if (error !== null) {
    throw new Error(`could not store consistency check: ${error.message}`);
  }
}

/** Newest stored check for one contract, or null when none has run. */
export async function latestCheck(contract: string): Promise<StoredConsistencyCheck | null> {
  const { data, error } = await db
    .from("indexer_consistency_checks")
    .select("contract_id, checked_at, ok, mismatches")
    .eq("contract_id", contract)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error !== null) {
    throw new Error(`could not read consistency checks: ${error.message}`);
  }

  if (data === null) {
    return null;
  }

  return {
    contract_id: String(data.contract_id),
    checked_at: String(data.checked_at),
    ok: Boolean(data.ok),
    mismatches: (data.mismatches ?? []) as ConsistencyReport["mismatches"],
  };
}

export function describeCheck(run: ConsistencyRun): string {
  return `${run.checkedAt}: ${formatConsistency(run.report)}`;
}
