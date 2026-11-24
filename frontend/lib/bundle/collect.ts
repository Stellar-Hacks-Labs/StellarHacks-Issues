/**
 * Assemble the five evidence sections from the durable log.
 *
 * Only `chain_events` and `chain_reads` feed this. Sealed scorecard and ballot
 * rows never enter, which is how an unrevealed hackathon still exports without
 * leaking the AGE envelopes sitting in Postgres.
 */

import { redactRecord } from "./redact";
import { encodeManifest, buildManifest } from "./manifest";
import { stableStringify, toJsonl, utf8 } from "./serialize";

export interface ChainEventRow {
  contract_id: string;
  ledger: number;
  event_index: number;
  name: string;
  payload: Record<string, unknown>;
  occurred_at: string;
}

export interface ChainReadRow {
  contract_id: string;
  ledger: number;
  kind: string;
  key: string;
  data: Record<string, unknown>;
}

export interface BundleSource {
  contractId: string;
  events: readonly ChainEventRow[];
  reads: readonly ChainReadRow[];
}

const ROOT_EVENTS = new Set(["ScoreRootPublished", "BallotRootPublished"]);
const DISCLOSURE_EVENTS = new Set(["ScoreRevealed", "BallotCounted"]);
const PAYOUT_EVENTS = new Set([
  "PrizePaid",
  "PlatformFeeSettled",
  "UnclaimedSwept",
  "ShareSwept",
  "NoAwardResolved",
]);

/**
 * Build the zip payloads for one hackathon.
 *
 * Event order is the chain's order. The constitution is the latest
 * `constitution` read; earlier ones stay in `events.jsonl` via `RulesLocked`
 * and are not duplicated here.
 */
export function collectBundle(source: BundleSource): Map<string, Uint8Array> {
  const events = [...source.events]
    .filter((row) => row.contract_id === source.contractId)
    .sort(byChainOrder)
    .map((row) => redactRecord({ ...row }));

  const reads = [...source.reads]
    .filter((row) => row.contract_id === source.contractId)
    .sort(byReadOrder)
    .map((row) => redactRecord({ ...row }));

  const constitution = latestConstitution(reads);
  const roots = rootsFrom(events);
  const disclosures = events.filter((row) => DISCLOSURE_EVENTS.has(String(row.name)));
  const payouts = events.filter((row) => PAYOUT_EVENTS.has(String(row.name)));

  const files = new Map<string, Uint8Array>();
  files.set("constitution.json", utf8(stableStringify(constitution) + "\n"));
  files.set("events.jsonl", utf8(toJsonl(events)));
  files.set("roots.json", utf8(stableStringify(roots) + "\n"));
  files.set("disclosures.jsonl", utf8(toJsonl(disclosures)));
  files.set("payouts.jsonl", utf8(toJsonl(payouts)));

  const manifest = buildManifest(source.contractId, files);
  files.set("manifest.json", encodeManifest(manifest));

  return files;
}

function byChainOrder(a: ChainEventRow, b: ChainEventRow): number {
  if (a.ledger !== b.ledger) {
    return a.ledger - b.ledger;
  }
  return a.event_index - b.event_index;
}

function byReadOrder(a: ChainReadRow, b: ChainReadRow): number {
  if (a.ledger !== b.ledger) {
    return a.ledger - b.ledger;
  }
  if (a.kind !== b.kind) {
    return a.kind < b.kind ? -1 : 1;
  }
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

function latestConstitution(reads: Record<string, unknown>[]): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null;
  let bestLedger = -1;

  for (const row of reads) {
    if (row.kind !== "constitution") {
      continue;
    }
    const ledger = Number(row.ledger);
    if (ledger >= bestLedger) {
      bestLedger = ledger;
      best = row;
    }
  }

  return best;
}

function rootsFrom(events: Record<string, unknown>[]): {
  score_root: string | null;
  ballot_root: string | null;
} {
  let score_root: string | null = null;
  let ballot_root: string | null = null;

  for (const row of events) {
    if (!ROOT_EVENTS.has(String(row.name))) {
      continue;
    }

    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const root = extractRoot(payload);

    if (row.name === "ScoreRootPublished") {
      score_root = root;
    }
    if (row.name === "BallotRootPublished") {
      ballot_root = root;
    }
  }

  return { score_root, ballot_root };
}

function extractRoot(payload: Record<string, unknown>): string | null {
  const direct = payload.root ?? payload.Root;
  if (typeof direct === "string" && direct.length > 0) {
    return direct.startsWith("\\x") ? direct.slice(2) : direct;
  }

  const fields = payload.fields;
  if (fields !== null && typeof fields === "object") {
    const nested = (fields as Record<string, unknown>).root;
    if (typeof nested === "string" && nested.length > 0) {
      return nested.startsWith("\\x") ? nested.slice(2) : nested;
    }
  }

  return null;
}
