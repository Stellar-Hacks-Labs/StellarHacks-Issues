import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  checkReceipt,
  receiptFor,
  traceSponsorship,
  type PayoutRecord,
  type PrizePlace,
  type SponsorshipRecord,
} from "../src/sponsorship-trace.js";

/**
 * The properties a receipt rests on, for the case where tracing is exact.
 *
 * A receipt is printed by the same application a sponsor is being asked to
 * doubt, so what makes it worth having is that it can be checked here against
 * records read independently. These are the ways it should fail: a figure that
 * does not reconcile, a transaction hash that belongs to another position, and
 * a hash the trace reached that the receipt quietly left out.
 */

const recorded = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "..", "fixtures", "sponsors", "directed.json"), "utf8"),
) as {
  contract: string;
  places: { track: string; rank: number; worth: string }[];
  contributions: { index: number; sponsor: string; track: string; rank: number; amount: string; fee: string; at: number }[];
  payouts: { track: string; rank: number; recipient: string; amount: string; kind: number; ledger: number; txHash: string }[];
};

const places: PrizePlace[] = recorded.places.map((place) => ({ ...place, worth: BigInt(place.worth) }));
const payouts: PayoutRecord[] = recorded.payouts.map((payout) => ({
  ...payout,
  amount: BigInt(payout.amount),
  kind: payout.kind as 0 | 1 | 2,
}));
const record: SponsorshipRecord = {
  ...recorded.contributions[0]!,
  amount: BigInt(recorded.contributions[0]!.amount),
  fee: BigInt(recorded.contributions[0]!.fee),
};
const trace = traceSponsorship(record, places, payouts);

describe("a receipt that agrees with the records", () => {
  it("has nothing to report", () => {
    expect(checkReceipt(receiptFor(recorded.contract, trace), { record, trace })).toEqual([]);
  });
});

describe("a receipt that does not", () => {
  it("is caught when an amount is edited", () => {
    const edited = { ...receiptFor(recorded.contract, trace), amount: "9999" };
    const problems = checkReceipt(edited, { record, trace });

    expect(problems.map((problem) => problem.field)).toContain("amount");
  });

  it("is caught when the total is not the contribution plus its fee", () => {
    const edited = { ...receiptFor(recorded.contract, trace), paid: "1000" };

    expect(checkReceipt(edited, { record, trace }).map((problem) => problem.says)).toContain(
      "is not the contribution plus its fee",
    );
  });

  it("is caught when it cites a payout this contribution never reached", () => {
    const stranger = "9999999999999999999999999999999999999999999999999999999999999999";
    const edited = { ...receiptFor(recorded.contract, trace), payoutTxHashes: [stranger] };
    const problems = checkReceipt(edited, { record, trace });

    expect(problems.some((problem) => problem.says.includes("is not a payout this contribution reached"))).toBe(true);
    /* And the real one going missing is its own problem, because a receipt that
       drops a payout is as misleading as one that invents it. */
    expect(problems.some((problem) => problem.says.includes("the receipt omits it"))).toBe(true);
  });

  it("is caught when a hash is not a hash at all", () => {
    const edited = { ...receiptFor(recorded.contract, trace), payoutTxHashes: ["not-a-hash"] };

    expect(checkReceipt(edited, { record, trace }).some((problem) => problem.says.includes("is not a transaction hash"))).toBe(true);
  });

  it("is caught when it claims a route the records do not show", () => {
    const edited = { ...receiptFor(recorded.contract, trace), routes: ["returned" as const] };

    expect(checkReceipt(edited, { record, trace }).map((problem) => problem.field)).toContain("routes");
  });

  it("is caught when it is about another contribution", () => {
    const other: SponsorshipRecord = {
      ...record,
      index: 1,
      rank: 2,
      amount: 500n,
      fee: 25n,
      at: record.at + 600,
    };
    const problems = checkReceipt(receiptFor(recorded.contract, trace), {
      record: other,
      trace: traceSponsorship(other, places, payouts),
    });

    expect(problems.map((problem) => problem.field)).toEqual(
      expect.arrayContaining(["amount", "fee", "paid", "sponsorshipIndex", "rank", "at"]),
    );
  });
});

describe("a position the frozen table does not contain", () => {
  it("is traced, and said, rather than silently reaching nothing", () => {
    const invented: SponsorshipRecord = { ...record, rank: 9 };
    const odd = traceSponsorship(invented, places, payouts);

    expect(odd.legs).toHaveLength(1);
    expect(odd.legs[0]!.route).toBe("unsettled");
    expect(odd.notes.join(" ")).toContain("has no rank 9 in ai");
  });
});

describe("a payout in another track", () => {
  it("is never traced to this contribution", () => {
    const elsewhere: PayoutRecord[] = [
      { ...payouts[0]!, track: "tooling", txHash: "1".repeat(64) },
      ...payouts,
    ];
    const traced = traceSponsorship(record, places, elsewhere);

    expect(traced.legs[0]!.payouts.map((payout) => payout.txHash)).toEqual([payouts[0]!.txHash]);
  });
});
