/**
 * What happened to one sponsor's money, derived from the chain's own records.
 *
 * Problem P7 in the README is that a sponsor cannot demonstrate funds were
 * distributed as announced. The contract already records enough to answer it —
 * every contribution, every prize position, every payment out of the vault —
 * but nothing joins the three, so a sponsor asking "where did my thousand go"
 * has to be told rather than shown.
 *
 * This is the join, and it lives in the SDK rather than in the application for
 * the same reason the ranking does: a sponsor who wants to check the answer
 * must be able to derive it themselves from chain data alone. Every input below
 * is something a stranger can read off the contract or the ledger.
 *
 * It is deliberately incapable of inventing one thing. A contribution aimed at
 * a whole track was divided between that track's positions at the moment it
 * landed, and the `Sponsorship` record does not carry the split that was used —
 * only the track, the rank sentinel of zero, and the amount. So an undirected
 * contribution is traced to the track's payouts as a whole and says so, rather
 * than reconstructing a per place share that would look like evidence and be a
 * guess. The directed case, which is the one a sponsor backing "first prize in
 * the AI track" cares about, is exact.
 */

/** One contribution, as `sponsorship(i)` returns it. */
export interface SponsorshipRecord {
  /** Its index in the contract's own list, which is how it is cited. */
  index: number;
  sponsor: string;
  track: string;
  /** The position backed, or zero for a contribution spread over the track. */
  rank: number;
  /** What reaches a winner, in the smallest unit of the prize asset. */
  amount: bigint;
  /** What the platform took on top, paid by the sponsor in the same call. */
  fee: bigint;
  /** Ledger time the contribution landed. */
  at: number;
}

/** One position in a prize table, with what it is worth after every bonus. */
export interface PrizePlace {
  track: string;
  rank: number;
  worth: bigint;
}

/**
 * One payment out of the vault, as the ledger recorded it.
 *
 * `kind` is the contract's own enumeration and the three values are three
 * different endings that must never be shown as one: `0` paid to a winner,
 * `1` swept back after the claim period expired, `2` returned because the
 * track made no award.
 */
export interface PayoutRecord {
  track: string;
  rank: number;
  recipient: string;
  amount: bigint;
  kind: 0 | 1 | 2;
  ledger: number;
  /** Hex, 64 characters, as the ledger recorded it. */
  txHash: string;
}

/**
 * Where a contribution ended up.
 *
 * `unsettled` is not a failure and not a missing value: the event has not paid
 * that position yet. Reporting it as anything else would turn "the hackathon is
 * still running" into "your money went nowhere".
 */
export type TraceRoute = "paid" | "swept" | "returned" | "unsettled";

export interface TracedLeg {
  track: string;
  /** The position this leg is about, or null when the leg is the whole track. */
  rank: number | null;
  route: TraceRoute;
  /** What the vault paid along this leg, which is the prize and not the contribution. */
  paidOut: bigint;
  payouts: PayoutRecord[];
}

export interface SponsorshipTrace {
  contribution: SponsorshipRecord;
  /** Prize plus fee: what the sponsor's wallet actually sent. */
  paid: bigint;
  /** True when the sponsor named a position, which is the exactly traceable case. */
  directed: boolean;
  legs: TracedLeg[];
  /** Every route this contribution reached, in a fixed order. */
  routes: TraceRoute[];
  /** What the trace can and cannot say, in words a sponsor can read. */
  notes: string[];
}

const ROUTE_ORDER: TraceRoute[] = ["paid", "swept", "returned", "unsettled"];

function routeOf(payouts: readonly PayoutRecord[]): TraceRoute {
  if (payouts.length === 0) {
    return "unsettled";
  }
  /* A position can carry more than one payment row — a prize split between a
     team's members is one row each — and on a cancelled or unclaimed track the
     sweep and the return are the whole story. Where rows disagree, the stronger
     statement wins: money that reached a winner is reported as paid even if a
     later row swept a remainder. */
  if (payouts.some((payout) => payout.kind === 0)) {
    return "paid";
  }
  if (payouts.some((payout) => payout.kind === 2)) {
    return "returned";
  }

  return "swept";
}

function totalOf(payouts: readonly PayoutRecord[]): bigint {
  return payouts.reduce((sum, payout) => sum + payout.amount, 0n);
}

function sameTrack(left: string, right: string): boolean {
  return left.trim() === right.trim();
}

/**
 * The trace for one contribution.
 *
 * Directed: one leg, the position the sponsor named, and the payments the
 * vault made for it. Undirected: one leg per position in the track, because
 * the contribution was spread over all of them and the record does not say in
 * what proportion.
 */
export function traceSponsorship(
  contribution: SponsorshipRecord,
  places: readonly PrizePlace[],
  payouts: readonly PayoutRecord[],
): SponsorshipTrace {
  const paid = contribution.amount + contribution.fee;
  const directed = contribution.rank > 0;
  const trackPlaces = places.filter((place) => sameTrack(place.track, contribution.track));
  const trackPayouts = payouts.filter((payout) => sameTrack(payout.track, contribution.track));
  const notes: string[] = [];
  const legs: TracedLeg[] = [];

  if (directed) {
    const own = trackPayouts.filter((payout) => payout.rank === contribution.rank);

    legs.push({
      track: contribution.track,
      rank: contribution.rank,
      route: routeOf(own),
      paidOut: totalOf(own),
      payouts: [...own].sort(byLedgerThenRecipient),
    });

    if (!trackPlaces.some((place) => place.rank === contribution.rank)) {
      /* A position the frozen table does not contain. The contract refuses such
         a contribution, so this is evidence that the inputs disagree rather
         than that the sponsor did something odd — and it is said rather than
         silently traced to nothing. */
      notes.push(
        `The prize table read here has no rank ${contribution.rank} in ${contribution.track}, so this contribution's position could not be confirmed against it.`,
      );
    }
  } else {
    notes.push(
      "This contribution was spread over every position in the track. The contract recorded the track, the amount and the fee, but not the split it used at the time, so it is traced to the track's payouts as a whole rather than to a share per position.",
    );

    const ranks = [...new Set(trackPlaces.map((place) => place.rank))].sort((a, b) => a - b);

    for (const rank of ranks) {
      const own = trackPayouts.filter((payout) => payout.rank === rank);

      legs.push({
        track: contribution.track,
        rank,
        route: routeOf(own),
        paidOut: totalOf(own),
        payouts: [...own].sort(byLedgerThenRecipient),
      });
    }

    if (ranks.length === 0) {
      /* No table read at all: the trace still has something true to say, which
         is the track's payouts without a position breakdown. */
      legs.push({
        track: contribution.track,
        rank: null,
        route: routeOf(trackPayouts),
        paidOut: totalOf(trackPayouts),
        payouts: [...trackPayouts].sort(byLedgerThenRecipient),
      });
      notes.push("No prize table was read for this track, so the positions it contains are unknown here.");
    }
  }

  const routes = ROUTE_ORDER.filter((route) => legs.some((leg) => leg.route === route));

  if (routes.includes("unsettled")) {
    notes.push("A position with no payment row has not been paid yet. That is the event still running, not money that went nowhere.");
  }
  if (routes.includes("swept")) {
    notes.push("A swept position is the declared surplus route: the claim period expired and the vault returned that prize to the pool the rules named.");
  }
  if (routes.includes("returned")) {
    notes.push("A returned position is the declared refund route: the track made no award, so the prize went back rather than to a winner.");
  }

  return { contribution, paid, directed, legs, routes, notes };
}

function byLedgerThenRecipient(left: PayoutRecord, right: PayoutRecord): number {
  return left.ledger - right.ledger || left.recipient.localeCompare(right.recipient);
}

/** Every contribution of one sponsor at one event, newest first, each traced. */
export function traceSponsor(
  sponsor: string,
  records: readonly SponsorshipRecord[],
  places: readonly PrizePlace[],
  payouts: readonly PayoutRecord[],
): SponsorshipTrace[] {
  return records
    .filter((record) => record.sponsor === sponsor)
    .sort((left, right) => right.at - left.at || right.index - left.index)
    .map((record) => traceSponsorship(record, places, payouts));
}

/** What a sponsor gave an event, and what the vault has paid along the way. */
export interface SponsorTotals {
  contributions: number;
  /** Prize money given, excluding the platform fee. */
  given: bigint;
  /** Fees paid on top. */
  fees: bigint;
  /** Prize plus fee, which is what left the sponsor's wallet. */
  paid: bigint;
  /** What the vault has paid out along the positions these contributions backed. */
  paidOut: bigint;
  routes: TraceRoute[];
}

export function totalsFor(traces: readonly SponsorshipTrace[]): SponsorTotals {
  const given = traces.reduce((sum, trace) => sum + trace.contribution.amount, 0n);
  const fees = traces.reduce((sum, trace) => sum + trace.contribution.fee, 0n);

  return {
    contributions: traces.length,
    given,
    fees,
    paid: given + fees,
    /* Deliberately not compared against `given`. A position's payout is the
       frozen prize plus every contribution to it, so the money the vault paid
       along a leg is almost never this sponsor's contribution and claiming
       otherwise would be the one dishonest number this feature could print. */
    paidOut: traces.reduce(
      (sum, trace) => sum + trace.legs.reduce((legs, leg) => legs + leg.paidOut, 0n),
      0n,
    ),
    routes: ROUTE_ORDER.filter((route) => traces.some((trace) => trace.routes.includes(route))),
  };
}

/** A receipt, as the application hands one to a sponsor. */
export interface SponsorReceipt {
  contract: string;
  sponsorshipIndex: number;
  sponsor: string;
  track: string;
  rank: number;
  amount: string;
  fee: string;
  paid: string;
  at: number;
  /** The payout transactions the trace reached, hex, as cited on the receipt. */
  payoutTxHashes: string[];
  /** The route or routes the contribution reached. */
  routes: TraceRoute[];
}

export interface ReceiptProblem {
  field: string;
  says: string;
}

const HASH = /^[0-9a-f]{64}$/;
const WHOLE = /^-?\d+$/;

/**
 * Whether a receipt agrees with the records it claims to be about.
 *
 * This is the function that makes a receipt worth having. The application that
 * printed it is the same application a sponsor is being asked to doubt, so the
 * receipt is checkable here against the contribution and the payments read
 * independently: the amounts have to reconcile, and every transaction hash it
 * cites has to be one of the payouts the trace actually reached.
 *
 * Returns the problems rather than a boolean. "Your receipt is wrong" is not
 * something to say without saying where.
 */
export function checkReceipt(
  receipt: SponsorReceipt,
  against: { record: SponsorshipRecord; trace: SponsorshipTrace },
): ReceiptProblem[] {
  const problems: ReceiptProblem[] = [];
  const say = (field: string, says: string) => problems.push({ field, says });

  for (const [field, value] of [
    ["amount", receipt.amount],
    ["fee", receipt.fee],
    ["paid", receipt.paid],
  ] as const) {
    if (!WHOLE.test(value)) {
      say(field, "is not a whole number in the asset's smallest unit");
    }
  }

  if (problems.length === 0) {
    if (BigInt(receipt.amount) !== against.record.amount) {
      say("amount", "does not match the contribution the contract recorded");
    }
    if (BigInt(receipt.fee) !== against.record.fee) {
      say("fee", "does not match the fee the contract recorded");
    }
    if (BigInt(receipt.paid) !== against.record.amount + against.record.fee) {
      say("paid", "is not the contribution plus its fee");
    }
  }

  if (receipt.sponsorshipIndex !== against.record.index) {
    say("sponsorshipIndex", "is not the contribution this receipt is checked against");
  }
  if (receipt.sponsor !== against.record.sponsor) {
    say("sponsor", "is not the address that paid");
  }
  if (receipt.track.trim() !== against.record.track.trim()) {
    say("track", "is not the track the contribution named");
  }
  if (receipt.rank !== against.record.rank) {
    say("rank", "is not the position the contribution named");
  }
  if (receipt.at !== against.record.at) {
    say("at", "is not when the contribution landed");
  }

  const reached = new Set(
    against.trace.legs.flatMap((leg) => leg.payouts.map((payout) => payout.txHash)),
  );

  for (const hash of receipt.payoutTxHashes) {
    if (!HASH.test(hash)) {
      say("payoutTxHashes", `${hash} is not a transaction hash`);
      continue;
    }
    if (!reached.has(hash)) {
      say("payoutTxHashes", `${hash} is not a payout this contribution reached`);
    }
  }

  for (const hash of reached) {
    if (!receipt.payoutTxHashes.includes(hash)) {
      say("payoutTxHashes", `${hash} is a payout this contribution reached and the receipt omits it`);
    }
  }

  const claimed = [...receipt.routes].sort().join(",");
  const derived = [...against.trace.routes].sort().join(",");

  if (claimed !== derived) {
    say("routes", `says ${claimed || "nothing"} where the records say ${derived || "nothing"}`);
  }

  return problems;
}

/** The receipt for one traced contribution, built from the trace and nothing else. */
export function receiptFor(contract: string, trace: SponsorshipTrace): SponsorReceipt {
  return {
    contract,
    sponsorshipIndex: trace.contribution.index,
    sponsor: trace.contribution.sponsor,
    track: trace.contribution.track,
    rank: trace.contribution.rank,
    amount: trace.contribution.amount.toString(),
    fee: trace.contribution.fee.toString(),
    paid: trace.paid.toString(),
    at: trace.contribution.at,
    payoutTxHashes: [
      ...new Set(trace.legs.flatMap((leg) => leg.payouts.map((payout) => payout.txHash))),
    ].sort(),
    routes: trace.routes,
  };
}
