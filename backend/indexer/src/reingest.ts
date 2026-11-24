import { clampToRetention, normalize, paginate, type LedgerRange } from "./ranges.js";
import type { StoredEvent, StoredRead } from "./records.js";

/**
 * Re-reading a bounded ledger range into the durable log.
 *
 * Idempotent because `store` upserts on the event's chain identity. Running the
 * same range twice must leave the row count unchanged; that is the acceptance
 * criterion the issue names, and it is why this never deletes before writing.
 *
 * Network and database helpers load inside `reingest` so the pure counters
 * below can be unit-tested without resolving the SDK package entry.
 */

/** Widest single RPC window a re-ingest page may ask for. */
export const MAX_REINGEST_PAGE = 2_000;

export interface ReingestPass {
  events: StoredEvent[];
  reads: StoredRead[];
}

export interface ReingestResult {
  range: LedgerRange;
  events: number;
  reads: number;
  pages: number;
  resolvedGaps: number;
  /** True when the requested range had to be cut to what RPC still serves. */
  clamped: boolean;
}

/**
 * Pure accounting over passes, so a duplicate-range fixture can prove
 * idempotency without a database.
 *
 * Two passes covering the same events collapse to one set of identities. The
 * returned count is what a second re-ingest must report as newly written when
 * the store is an upsert: zero new identities.
 */
export function countUniqueEvents(passes: readonly ReingestPass[]): number {
  const seen = new Set<string>();

  for (const pass of passes) {
    for (const event of pass.events) {
      seen.add(`${event.contract_id}:${event.ledger}:${event.event_index}`);
    }
  }

  return seen.size;
}

export function countUniqueReads(passes: readonly ReingestPass[]): number {
  const seen = new Set<string>();

  for (const pass of passes) {
    for (const read of pass.reads) {
      seen.add(`${read.contract_id}:${read.ledger}:${read.kind}:${read.key}`);
    }
  }

  return seen.size;
}

/**
 * How many identities in `second` were already present in `first`.
 *
 * A perfect re-ingest overlap returns the size of `second`. Anything less means
 * the second pass found events the first pass never wrote, which is a gap, not
 * a duplicate.
 */
export function overlapEventCount(
  first: readonly ReingestPass[],
  second: readonly ReingestPass[],
): number {
  const seen = new Set<string>();

  for (const pass of first) {
    for (const event of pass.events) {
      seen.add(`${event.contract_id}:${event.ledger}:${event.event_index}`);
    }
  }

  let overlap = 0;

  for (const pass of second) {
    for (const event of pass.events) {
      const id = `${event.contract_id}:${event.ledger}:${event.event_index}`;

      if (seen.has(id)) {
        overlap += 1;
      }
    }
  }

  return overlap;
}

export async function reingest(contract: string, fromLedger: number, toLedger: number): Promise<ReingestResult> {
  const { rpc } = await import("@stellar/stellar-sdk");
  const { settings } = await import("./config.js");
  const { resolveGapsInside } = await import("./gaps.js");
  const { readRange, store } = await import("./ingest.js");

  const server = new rpc.Server(settings.rpcUrl);
  const requested = normalize(fromLedger, toLedger);
  const node = await server.getHealth();
  const clamped = clampToRetention(requested, node.oldestLedger, node.latestLedger);

  if (clamped === null) {
    throw new Error(
      `range ${requested.from}-${requested.to} is outside RPC retention ` +
        `(${node.oldestLedger}-${node.latestLedger})`,
    );
  }

  const pages = paginate(clamped, MAX_REINGEST_PAGE);
  let events = 0;
  let reads = 0;

  for (const page of pages) {
    const pass = await readRange(contract, page.from, page.to);
    await store(contract, pass);
    events += pass.events.length;
    reads += pass.reads.length;
  }

  const resolvedGaps = await resolveGapsInside(contract, clamped);

  return {
    range: clamped,
    events,
    reads,
    pages: pages.length,
    resolvedGaps,
    clamped: clamped.from !== requested.from || clamped.to !== requested.to,
  };
}
