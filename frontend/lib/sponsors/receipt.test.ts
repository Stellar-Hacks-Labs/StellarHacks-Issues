import { describe, expect, it } from "vitest";

import { RECEIPT_LIMITS, receiptLines, receiptOf, verificationCommand } from "./receipt";
import { traceSponsorship } from "./trace";
import { CONTRACT, HASHES, payouts, places, records, WINNER } from "./fixtures";

const record = records()[0]!;
const trace = traceSponsorship(record, places(), payouts());
const receipt = receiptOf(CONTRACT, trace);

describe("a receipt", () => {
  it("states what was given, what it was aimed at and what happened", () => {
    const lines = receiptLines(receipt, trace);
    const said = new Map(lines.map((line) => [line.label, line.value]));

    expect(said.get("Prize given")).toBe("1000");
    expect(said.get("Platform fee")).toBe("50");
    expect(said.get("Paid in total")).toBe("1050");
    expect(said.get("Position")).toBe("place 1");
    expect(said.get("Outcome, place 1")).toBe("paid to a winner");
  });

  it("cites the payout transaction, so it can be opened on an explorer", () => {
    const paid = receiptLines(receipt, trace).find((line) => line.label === "Paid out, place 1");

    expect(paid?.txHash).toBe(HASHES.one);
    expect(paid?.value).toContain(WINNER);
    expect(paid?.value).toContain("3000");
  });

  it("says every place in the track when the contribution named none", () => {
    const undirected = { ...record, rank: 0 };
    const spread = traceSponsorship(undirected, places(), payouts());
    const said = new Map(receiptLines(receiptOf(CONTRACT, spread), spread).map((line) => [line.label, line.value]));

    expect(said.get("Position")).toBe("every place in the track");
    expect(said.has("Outcome, place 1")).toBe(true);
    expect(said.has("Outcome, place 2")).toBe(true);
  });

  it("cites every payout the trace reached, sorted, so the SDK's check can compare it", () => {
    /* `checkReceipt` in the SDK compares this list against the payouts it
       reaches and reports both a hash the receipt invented and one it omitted.
       Both halves are covered there; what this side owes is a list that is
       complete and in a stable order. */
    expect(receipt.payoutTxHashes).toEqual([HASHES.one]);
    expect(receipt.routes).toEqual(["paid"]);
    expect(BigInt(receipt.paid)).toBe(BigInt(receipt.amount) + BigInt(receipt.fee));
  });
});

describe("the command printed on a receipt", () => {
  it("names the SDK's own check and the contribution it is about", () => {
    const command = verificationCommand(receipt);

    expect(command).toContain("checkReceipt");
    expect(command).toContain("traceSponsorship");
    expect(command).toContain(CONTRACT);
    expect(command).toContain(`sponsorship(${receipt.sponsorshipIndex})`);
  });
});

describe("what a receipt does not prove", () => {
  it("is written down, including that it is not an invoice", () => {
    expect(RECEIPT_LIMITS.join(" ")).toContain("No record separates one sponsor's share back out");
    expect(RECEIPT_LIMITS.join(" ")).toContain("not an invoice");
  });
});
