import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  receiptFor,
  totalsFor,
  traceSponsor,
  traceSponsorship,
  type PayoutRecord,
  type PrizePlace,
  type SponsorshipRecord,
} from "../src/sponsorship-trace.js";

/**
 * Where a sponsor's money went, derived from chain records and compared against
 * the answer written beside them.
 *
 * The scenarios live in `fixtures/sponsors/` rather than in this file for the
 * same reason the ranking's inputs do: a sponsor checking the claim is doing
 * exactly this derivation, and the rule it depends on has to be written
 * somewhere neither implementation owns.
 */

type Fixture = {
  contract: string;
  places: { track: string; rank: number; worth: string }[];
  contributions: { index: number; sponsor: string; track: string; rank: number; amount: string; fee: string; at: number }[];
  payouts: { track: string; rank: number; recipient: string; amount: string; kind: number; ledger: number; txHash: string }[];
  expected: Record<string, unknown>;
};

function fixture(name: string): Fixture {
  const path = join(import.meta.dirname, "..", "..", "fixtures", "sponsors", `${name}.json`);

  return JSON.parse(readFileSync(path, "utf8")) as Fixture;
}

function places(recorded: Fixture): PrizePlace[] {
  return recorded.places.map((place) => ({ ...place, worth: BigInt(place.worth) }));
}

function payouts(recorded: Fixture): PayoutRecord[] {
  return recorded.payouts.map((payout) => ({
    ...payout,
    amount: BigInt(payout.amount),
    kind: payout.kind as 0 | 1 | 2,
  }));
}

function contributions(recorded: Fixture): SponsorshipRecord[] {
  return recorded.contributions.map((row) => ({
    ...row,
    amount: BigInt(row.amount),
    fee: BigInt(row.fee),
  }));
}

describe("a contribution aimed at a named position", () => {
  const recorded = fixture("directed");
  const expected = recorded.expected["perSponsor"] as Array<Record<string, never>>;

  it("traces to the payout of that position, and to no other", () => {
    for (const want of expected) {
      const traces = traceSponsor(
        String(want["sponsor"]),
        contributions(recorded),
        places(recorded),
        payouts(recorded),
      );
      const wanted = want["traces"] as Array<Record<string, never>>;

      expect(traces.map((trace) => trace.contribution.index)).toEqual(
        wanted.map((one) => Number(one["index"])),
      );

      traces.forEach((trace, at) => {
        const legs = wanted[at]!["legs"] as Array<Record<string, never>>;

        expect(trace.directed).toBe(Boolean(wanted[at]!["directed"]));
        expect(trace.legs.map((leg) => leg.rank)).toEqual(legs.map((leg) => Number(leg["rank"])));
        expect(trace.legs.map((leg) => leg.route)).toEqual(legs.map((leg) => String(leg["route"])));
        expect(trace.legs.map((leg) => leg.paidOut.toString())).toEqual(
          legs.map((leg) => String(leg["paidOut"])),
        );
        expect(trace.legs.map((leg) => leg.payouts.map((payout) => payout.txHash))).toEqual(
          legs.map((leg) => leg["txHashes"] as unknown as string[]),
        );
      });
    }
  });

  it("totals what each sponsor gave and what the fee was, separately", () => {
    for (const want of expected) {
      const totals = totalsFor(
        traceSponsor(String(want["sponsor"]), contributions(recorded), places(recorded), payouts(recorded)),
      );

      expect(totals.contributions).toBe(Number(want["contributions"]));
      expect(totals.given.toString()).toBe(String(want["given"]));
      expect(totals.fees.toString()).toBe(String(want["fees"]));
      expect(totals.paid.toString()).toBe(String(want["paid"]));
      expect(totals.routes).toEqual(want["routes"] as unknown as string[]);
    }
  });

  it("newest first, because a dashboard is read from the top", () => {
    const traces = traceSponsor(
      recorded.contributions[0]!.sponsor,
      contributions(recorded),
      places(recorded),
      payouts(recorded),
    );

    expect(traces.map((trace) => trace.contribution.at)).toEqual(
      [...traces.map((trace) => trace.contribution.at)].sort((a, b) => b - a),
    );
  });
});

describe("a contribution spread over a whole track", () => {
  const recorded = fixture("undirected");
  const expected = recorded.expected;

  it("is traced to every position in the track, and says the split was not recorded", () => {
    const [trace] = contributions(recorded).map((record) =>
      traceSponsorship(record, places(recorded), payouts(recorded)),
    );

    expect(trace!.directed).toBe(expected["directed"]);
    expect(trace!.paid.toString()).toBe(String(expected["paid"]));
    expect(trace!.routes).toEqual(expected["routes"] as unknown as string[]);

    const legs = expected["legs"] as Array<Record<string, never>>;

    expect(trace!.legs.map((leg) => [leg.rank, leg.route, leg.paidOut.toString()])).toEqual(
      legs.map((leg) => [Number(leg["rank"]), String(leg["route"]), String(leg["paidOut"])]),
    );

    for (const mention of expected["noteMentions"] as unknown as string[]) {
      expect(trace!.notes.join(" ")).toContain(mention);
    }
  });

  it("reports a position with no payment as unsettled rather than as nothing", () => {
    const [trace] = contributions(recorded).map((record) =>
      traceSponsorship(record, places(recorded), payouts(recorded)),
    );
    const unsettled = trace!.legs.filter((leg) => leg.route === "unsettled");

    expect(unsettled).toHaveLength(1);
    expect(unsettled[0]!.paidOut).toBe(0n);
    expect(unsettled[0]!.payouts).toEqual([]);
  });
});

describe("a track that paid nobody", () => {
  const recorded = fixture("cancelled");

  it("separates the refund route from the surplus route", () => {
    const traced = contributions(recorded).map((record) =>
      traceSponsorship(record, places(recorded), payouts(recorded)),
    );
    const expected = recorded.expected["traces"] as Array<Record<string, never>>;

    traced.forEach((trace, at) => {
      expect(trace.contribution.index).toBe(Number(expected[at]!["index"]));
      expect(trace.legs[0]!.route).toBe(String(expected[at]!["route"]));
      expect(trace.legs[0]!.paidOut.toString()).toBe(String(expected[at]!["paidOut"]));
      expect(trace.legs[0]!.payouts.map((payout) => payout.txHash)).toEqual(
        expected[at]!["txHashes"] as unknown as string[],
      );
    });

    const totals = totalsFor(traced);

    expect(totals.routes).toEqual(recorded.expected["sponsorRoutes"] as unknown as string[]);

    for (const mention of recorded.expected["noteMentions"] as unknown as string[]) {
      expect(traced.flatMap((trace) => trace.notes).join(" ")).toContain(mention);
    }
  });

  it("never calls a return or a sweep a payout", () => {
    const traced = contributions(recorded).map((record) =>
      traceSponsorship(record, places(recorded), payouts(recorded)),
    );

    expect(traced.some((trace) => trace.routes.includes("paid"))).toBe(false);
  });
});

describe("a receipt built from a trace", () => {
  const recorded = fixture("directed");

  it("cites the contribution, the amounts and every payout the trace reached", () => {
    const [record] = contributions(recorded);
    const trace = traceSponsorship(record!, places(recorded), payouts(recorded));
    const receipt = receiptFor(recorded.contract, trace);

    expect(receipt).toEqual({
      contract: recorded.contract,
      sponsorshipIndex: 0,
      sponsor: record!.sponsor,
      track: "ai",
      rank: 1,
      amount: "1000",
      fee: "50",
      paid: "1050",
      at: record!.at,
      payoutTxHashes: ["aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111"],
      routes: ["paid"],
    });
  });
});
