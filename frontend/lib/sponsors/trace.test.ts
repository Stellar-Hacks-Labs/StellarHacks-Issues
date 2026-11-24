import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ROUTE_WORDS, stillOpen, traceSponsorship, viewFor, viewsFor, whereItWent } from "./trace";
import { OTHER_SPONSOR, payouts, places, records, SPONSOR } from "./fixtures";

describe("one sponsor's view", () => {
  const view = viewFor(SPONSOR, records(), places(), payouts());

  it("totals what they gave, separately from the fee they paid on top", () => {
    expect(view.totals).toMatchObject({
      contributions: 2,
      given: BigInt(1500),
      fees: BigInt(75),
      paid: BigInt(1575),
      routes: ["paid"],
    });
  });

  it("is newest first, and names the position each contribution backed", () => {
    expect(view.traces.map((trace) => [trace.contribution.at, trace.legs[0]?.rank])).toEqual([
      [200, 2],
      [100, 1],
    ]);
  });

  it("holds only this sponsor's contributions", () => {
    expect(view.traces.every((trace) => trace.contribution.sponsor === SPONSOR)).toBe(true);
    expect(viewFor(OTHER_SPONSOR, records(), places(), payouts()).traces).toHaveLength(1);
  });
});

describe("every sponsor's view", () => {
  it("is largest giver first, for a public table", () => {
    expect(viewsFor(records(), places(), payouts()).map((view) => view.sponsor)).toEqual([
      SPONSOR,
      OTHER_SPONSOR,
    ]);
  });
});

describe("the sentence a dashboard shows", () => {
  it("names the position and its ending, and claims no share of the payout", () => {
    const view = viewFor(SPONSOR, records(), places(), payouts());
    const said = whereItWent(view.traces[1]!);

    expect(said).toBe("Backed ai place 1, which was paid to its winner.");
    // The position was paid 3,000 against a 1,000 contribution. Naming a share
    // would be the one number no record supports.
    expect(said).not.toContain("1000");
    expect(said).not.toContain("3000");
  });

  it("says how far an undirected contribution has settled, without a share per place", () => {
    const undirected = [{ ...records()[0]!, rank: 0 }];
    const view = viewFor(SPONSOR, undirected, places(), payouts().slice(0, 1));

    expect(whereItWent(view.traces[0]!)).toBe("Spread over every position in ai: 1 of 2 have settled.");
  });

  it("has a word for each of the four endings", () => {
    expect(Object.keys(ROUTE_WORDS).sort()).toEqual(["paid", "returned", "swept", "unsettled"]);
    expect(ROUTE_WORDS.unsettled).toBe("Not paid yet");
  });
});

describe("whether anything is still open", () => {
  it("is true while a backed position has no payment", () => {
    expect(stillOpen(viewsFor(records(), places(), payouts()))).toBe(false);
    expect(stillOpen(viewsFor(records(), places(), payouts().slice(0, 1)))).toBe(true);
  });
});

describe("the shared fixtures", () => {
  /**
   * The agreement with the SDK, read from the file neither side owns.
   *
   * `sdk/test/sponsorship-trace.test.ts` asserts the package reaches these
   * outcomes; this asserts the application does. Two implementations of one
   * rule drift silently otherwise, and the file is what says which side moved.
   */
  const recorded = (name: string) =>
    JSON.parse(
      readFileSync(join(import.meta.dirname, "..", "..", "..", "fixtures", "sponsors", `${name}.json`), "utf8"),
    ) as {
      places: { track: string; rank: number; worth: string }[];
      contributions: { index: number; sponsor: string; track: string; rank: number; amount: string; fee: string; at: number }[];
      payouts: { track: string; rank: number; recipient: string; amount: string; kind: number; ledger: number; txHash: string }[];
      expected: Record<string, unknown>;
    };

  const inputs = (name: string) => {
    const file = recorded(name);

    return {
      file,
      places: file.places.map((place) => ({ ...place, worth: BigInt(place.worth) })),
      payouts: file.payouts.map((payout) => ({
        ...payout,
        amount: BigInt(payout.amount),
        kind: payout.kind as 0 | 1 | 2,
      })),
      records: file.contributions.map((row) => ({
        ...row,
        amount: BigInt(row.amount),
        fee: BigInt(row.fee),
      })),
    };
  };

  it("reaches the recorded totals and routes for every directed sponsor", () => {
    const { file, places: known, payouts: paid, records: given } = inputs("directed");

    for (const want of file.expected["perSponsor"] as Array<Record<string, never>>) {
      const view = viewFor(String(want["sponsor"]), given, known, paid);

      expect(view.totals.contributions).toBe(Number(want["contributions"]));
      expect(view.totals.given.toString()).toBe(String(want["given"]));
      expect(view.totals.fees.toString()).toBe(String(want["fees"]));
      expect(view.totals.paid.toString()).toBe(String(want["paid"]));
      expect(view.totals.routes).toEqual(want["routes"] as unknown as string[]);
    }
  });

  it("reaches the recorded legs for a contribution spread over a track", () => {
    const { file, places: known, payouts: paid, records: given } = inputs("undirected");
    const trace = traceSponsorship(given[0]!, known, paid);
    const legs = file.expected["legs"] as Array<Record<string, never>>;

    expect(trace.directed).toBe(file.expected["directed"]);
    expect(trace.paid.toString()).toBe(String(file.expected["paid"]));
    expect(trace.routes).toEqual(file.expected["routes"] as unknown as string[]);
    expect(trace.legs.map((leg) => [leg.rank, leg.route, leg.paidOut.toString()])).toEqual(
      legs.map((leg) => [Number(leg["rank"]), String(leg["route"]), String(leg["paidOut"])]),
    );
  });

  it("reaches the recorded endings for a track that paid nobody", () => {
    const { file, places: known, payouts: paid, records: given } = inputs("cancelled");
    const traced = given.map((record) => traceSponsorship(record, known, paid));
    const expected = file.expected["traces"] as Array<Record<string, never>>;

    traced.forEach((trace, at) => {
      expect(trace.legs[0]!.route).toBe(String(expected[at]!["route"]));
      expect(trace.legs[0]!.payouts.map((payout) => payout.txHash)).toEqual(
        expected[at]!["txHashes"] as unknown as string[],
      );
    });
    expect(traced.some((trace) => trace.routes.includes("paid"))).toBe(false);
  });
});
