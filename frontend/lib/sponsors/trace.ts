/**
 * Where a sponsor's money went, derived on this side from the same records.
 *
 * `sdk/src/sponsorship-trace.ts` holds the same rule, and neither file imports
 * the other. That is the shape the rest of this codebase already uses for
 * anything a participant must be able to check without us: two independent
 * implementations, with the agreement written down in `fixtures/sponsors/` so
 * a change on either side turns a suite red and the file says which side moved.
 *
 * The web application cannot simply call the SDK here — it does not depend on
 * that package, and adding a workspace dependency to ship a tracing rule would
 * put the whole SDK in the browser bundle. So it reads the rule, the fixtures
 * keep the two honest, and `frontend/lib/sponsors/trace.test.ts` is the half
 * that proves this side reaches the recorded answers.
 *
 * One thing it is deliberately unable to do: say what share of a payout was
 * this sponsor's. A position's payout is its frozen prize plus every
 * contribution to it, and no record separates one back out. Claiming otherwise
 * would be the single dishonest number this feature could print.
 */

/** One contribution, as `sponsorship(i)` returns it, with its index in that list. */
export interface SponsorshipRecord {
  index: number;
  sponsor: string;
  track: string;
  /** The position backed, or zero for a contribution spread over the track. */
  rank: number;
  amount: bigint;
  fee: bigint;
  at: number;
}

/** One prize position, worth the frozen amount plus every bonus on it. */
export interface PrizePlace {
  track: string;
  rank: number;
  worth: bigint;
}

/**
 * One payment out of the vault, as the indexer recorded it.
 *
 * `kind` is the contract's enumeration: `0` paid to a winner, `1` swept back
 * after the claim period, `2` returned because the track made no award. Three
 * different endings that must never be shown as one.
 */
export interface PayoutRecord {
  track: string;
  rank: number;
  recipient: string;
  amount: bigint;
  kind: 0 | 1 | 2;
  ledger: number;
  txHash: string;
}

export type TraceRoute = "paid" | "swept" | "returned" | "unsettled";

export interface TracedLeg {
  track: string;
  rank: number | null;
  route: TraceRoute;
  paidOut: bigint;
  payouts: PayoutRecord[];
}

export interface SponsorshipTrace {
  contribution: SponsorshipRecord;
  paid: bigint;
  directed: boolean;
  legs: TracedLeg[];
  routes: TraceRoute[];
  notes: string[];
}

const ROUTE_ORDER: TraceRoute[] = ["paid", "swept", "returned", "unsettled"];

/** What each ending means, said to the sponsor rather than to the ledger. */
export const ROUTE_WORDS: Record<TraceRoute, string> = {
  paid: "Paid to a winner",
  swept: "Swept back after the claim period",
  returned: "Returned because the track made no award",
  unsettled: "Not paid yet",
};

function routeOf(payouts: readonly PayoutRecord[]): TraceRoute {
  if (payouts.length === 0) {
    return "unsettled";
  }
  /* Where rows disagree the stronger statement wins: money that reached a
     winner is reported as paid even if a later row swept a remainder. */
  if (payouts.some((payout) => payout.kind === 0)) {
    return "paid";
  }
  if (payouts.some((payout) => payout.kind === 2)) {
    return "returned";
  }

  return "swept";
}

function totalOf(payouts: readonly PayoutRecord[]): bigint {
  return payouts.reduce((sum, payout) => sum + payout.amount, BigInt(0));
}

function byLedgerThenRecipient(left: PayoutRecord, right: PayoutRecord): number {
  return left.ledger - right.ledger || left.recipient.localeCompare(right.recipient);
}

/**
 * The trace for one contribution.
 *
 * Directed: one leg, the position the sponsor named. Undirected: one leg per
 * position in the track, because the contribution was spread over all of them
 * and the record does not say in what proportion.
 */
export function traceSponsorship(
  contribution: SponsorshipRecord,
  places: readonly PrizePlace[],
  payouts: readonly PayoutRecord[],
): SponsorshipTrace {
  const paid = contribution.amount + contribution.fee;
  const directed = contribution.rank > 0;
  const track = contribution.track.trim();
  const trackPlaces = places.filter((place) => place.track.trim() === track);
  const trackPayouts = payouts.filter((payout) => payout.track.trim() === track);
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

export interface SponsorTotals {
  contributions: number;
  given: bigint;
  fees: bigint;
  paid: bigint;
  /** What the vault paid along the positions these contributions backed — never this sponsor's share of it. */
  paidOut: bigint;
  routes: TraceRoute[];
}

export interface SponsorView {
  sponsor: string;
  traces: SponsorshipTrace[];
  totals: SponsorTotals;
}

export function viewFor(
  sponsor: string,
  records: readonly SponsorshipRecord[],
  places: readonly PrizePlace[],
  payouts: readonly PayoutRecord[],
): SponsorView {
  const traces = records
    .filter((record) => record.sponsor === sponsor)
    .sort((left, right) => right.at - left.at || right.index - left.index)
    .map((record) => traceSponsorship(record, places, payouts));
  const given = traces.reduce((sum, trace) => sum + trace.contribution.amount, BigInt(0));
  const fees = traces.reduce((sum, trace) => sum + trace.contribution.fee, BigInt(0));

  return {
    sponsor,
    traces,
    totals: {
      contributions: traces.length,
      given,
      fees,
      paid: given + fees,
      paidOut: traces.reduce(
        (sum, trace) => sum + trace.legs.reduce((legs, leg) => legs + leg.paidOut, BigInt(0)),
        BigInt(0),
      ),
      routes: ROUTE_ORDER.filter((route) => traces.some((trace) => trace.routes.includes(route))),
    },
  };
}

/** Every sponsor's view, largest giver first, for the public table. */
export function viewsFor(
  records: readonly SponsorshipRecord[],
  places: readonly PrizePlace[],
  payouts: readonly PayoutRecord[],
): SponsorView[] {
  return [...new Set(records.map((record) => record.sponsor))]
    .map((sponsor) => viewFor(sponsor, records, places, payouts))
    .sort(
      (left, right) =>
        (right.totals.given > left.totals.given ? 1 : right.totals.given < left.totals.given ? -1 : 0) ||
        left.sponsor.localeCompare(right.sponsor),
    );
}

/**
 * One line summarising where a contribution went.
 *
 * Names the position and the ending. It never quotes an amount, because the
 * only amounts available are the contribution and the position's whole payout,
 * and putting either next to the other invites the reading no record supports.
 */
export function whereItWent(trace: SponsorshipTrace): string {
  if (trace.legs.length === 0) {
    return "No position could be matched to this contribution.";
  }

  if (trace.directed) {
    const [leg] = trace.legs;
    const place = `${trace.contribution.track} place ${leg!.rank}`;

    switch (leg!.route) {
      case "paid":
        return `Backed ${place}, which was paid to its winner.`;
      case "swept":
        return `Backed ${place}, whose prize was swept back after the claim period expired.`;
      case "returned":
        return `Backed ${place}, which made no award, so the prize was returned.`;
      default:
        return `Backed ${place}, which has not been paid yet.`;
    }
  }

  const settled = trace.legs.filter((leg) => leg.route !== "unsettled").length;

  return `Spread over every position in ${trace.contribution.track}: ${settled} of ${trace.legs.length} have settled.`;
}

/** Whether anything here is still open, which is what a dashboard leads with. */
export function stillOpen(views: readonly SponsorView[]): boolean {
  return views.some((view) => view.totals.routes.includes("unsettled"));
}
