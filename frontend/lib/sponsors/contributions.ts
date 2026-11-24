import type { Contribution, Position } from "../sponsor";
import type { PayoutRecord, PrizePlace, SponsorshipRecord } from "./trace";

/**
 * The three things a trace needs, each taken from where it is actually true.
 *
 * Contributions come from the contract, because the wall of names and the
 * amounts behind it are the contract's and a list our database assembled is a
 * list our database could be wrong about. Payouts come from the indexed
 * `payments` log, because a payment is a ledger fact the contract does not
 * keep. Positions come from the frozen rules plus the bonuses on them.
 *
 * The shapes are `trace.ts`'s, and the same shapes the SDK's own tracer takes,
 * so a sponsor can feed the SDK the same three inputs and must reach the same
 * answer without this application in the way.
 */

/** The contract's own list, in the contract's own order, as trace inputs. */
export function indexContributions(records: readonly Contribution[]): SponsorshipRecord[] {
  /* Ordered by the index the contract assigned rather than by time. The wall
     hands this list over newest first, and two contributions sharing a ledger
     second would otherwise swap places — which would make a receipt cite the
     wrong one. */
  return [...records]
    .sort((left, right) => left.index - right.index)
    .map((record) => ({
      index: record.index,
      sponsor: record.sponsor,
      track: record.track,
      rank: record.rank,
      amount: record.amount,
      fee: record.fee,
      at: record.at,
    }));
}

/** Every address that has backed this event, in the order they first did. */
export function sponsorsOf(records: readonly SponsorshipRecord[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];

  for (const record of [...records].sort((left, right) => left.index - right.index)) {
    if (seen.has(record.sponsor)) {
      continue;
    }
    seen.add(record.sponsor);
    order.push(record.sponsor);
  }

  return order;
}

/** Only this address's contributions, which is all a private dashboard may show. */
export function contributionsBy(
  sponsor: string,
  records: readonly SponsorshipRecord[],
): SponsorshipRecord[] {
  return records.filter((record) => record.sponsor === sponsor);
}

export function placesFrom(positions: readonly Position[]): PrizePlace[] {
  return positions.map((position) => ({
    track: position.track,
    rank: position.rank,
    /* The frozen amount plus every contribution to it, which is what the
       position is worth now and what the contract divides an undirected
       contribution in proportion to. */
    worth: position.worth,
  }));
}

/**
 * Payment rows as the SDK reads them.
 *
 * A row this version cannot read is dropped and counted rather than guessed
 * at: every reader of the result either tells a sponsor their money reached a
 * winner or that it came back, and the two must never be swapped by a bad
 * cast. `bytea` arrives from PostgREST as `\x…`, which is not a transaction
 * hash until the prefix is gone.
 */
export function payoutsFrom(rows: readonly Record<string, unknown>[]): {
  payouts: PayoutRecord[];
  unreadable: number;
} {
  const payouts: PayoutRecord[] = [];
  let unreadable = 0;

  for (const row of rows) {
    const track = row["track"];
    const rank = Number(row["rank"]);
    const recipient = row["recipient"];
    const kind = Number(row["kind"]);
    const ledger = Number(row["ledger"]);
    const hash = String(row["tx_hash"] ?? "").replace(/^\\x/, "").toLowerCase();
    const amount = String(row["amount"] ?? "");

    if (
      typeof track !== "string" ||
      typeof recipient !== "string" ||
      !Number.isInteger(rank) ||
      rank < 1 ||
      !(kind === 0 || kind === 1 || kind === 2) ||
      !Number.isFinite(ledger) ||
      !/^\d+$/.test(amount) ||
      !/^[0-9a-f]{64}$/.test(hash)
    ) {
      unreadable += 1;
      continue;
    }

    payouts.push({
      track,
      rank,
      recipient,
      amount: BigInt(amount),
      kind: kind as 0 | 1 | 2,
      ledger,
      txHash: hash,
    });
  }

  return { payouts, unreadable };
}
