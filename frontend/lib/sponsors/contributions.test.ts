import { describe, expect, it } from "vitest";

import { contributionsBy, indexContributions, payoutsFrom, placesFrom, sponsorsOf } from "./contributions";
import { HASHES, OTHER_SPONSOR, paymentRows, places, SPONSOR, walletContributions } from "./fixtures";

describe("the contract's contribution list", () => {
  it("keeps the index the contract assigned, not one derived from the order", () => {
    // `contributionsOf` hands back newest first for the sponsor wall, and the
    // index is the position in the contract's own list. Two contributions
    // sharing a ledger second would swap under a time sort, and every receipt
    // after them would cite the wrong contribution.
    const indexed = indexContributions(walletContributions());

    expect(indexed.map((record) => [record.index, record.at])).toEqual([
      [0, 100],
      [1, 200],
      [2, 300],
    ]);
  });

  it("does not renumber contributions that share a timestamp", () => {
    const sameLedger = walletContributions().map((record) => ({ ...record, at: 100 }));

    expect(indexContributions(sameLedger).map((record) => record.index)).toEqual([0, 1, 2]);
  });

  it("keeps the amount and the fee apart", () => {
    const [first] = indexContributions(walletContributions());

    expect([first!.amount, first!.fee]).toEqual([BigInt(1000), BigInt(50)]);
  });

  it("names every sponsor once, in the order they first gave", () => {
    const indexed = indexContributions(walletContributions());

    expect(sponsorsOf(indexed)).toEqual([SPONSOR, OTHER_SPONSOR]);
  });

  it("filters to one sponsor, which is all a private dashboard may show", () => {
    const indexed = indexContributions(walletContributions());

    expect(contributionsBy(SPONSOR, indexed).map((record) => record.index)).toEqual([0, 1]);
    expect(contributionsBy(OTHER_SPONSOR, indexed).map((record) => record.index)).toEqual([2]);
    expect(contributionsBy("GNOBODY", indexed)).toEqual([]);
  });
});

describe("payment rows from the indexer", () => {
  it("drop the bytea prefix, because a hash with it is not a hash", () => {
    const { payouts, unreadable } = payoutsFrom(paymentRows());

    expect(unreadable).toBe(0);
    expect(payouts.map((payout) => payout.txHash)).toEqual([HASHES.one, HASHES.two]);
    expect(payouts[0]!.amount).toBe(BigInt(3000));
  });

  it("drop a row this version cannot read, and count it", () => {
    const [row] = paymentRows();
    const { payouts, unreadable } = payoutsFrom([
      row!,
      { ...row!, kind: 7 },
      { ...row!, rank: 0 },
      { ...row!, amount: "three thousand" },
      { ...row!, tx_hash: "\\xnothex" },
      { ...row!, recipient: 42 },
    ]);

    // Each of these would otherwise tell a sponsor their money reached a winner
    // or came back, and a bad cast must never be allowed to swap the two.
    expect(payouts).toHaveLength(1);
    expect(unreadable).toBe(5);
  });

  it("keeps the three endings distinguishable", () => {
    const [row] = paymentRows();
    const { payouts } = payoutsFrom([
      { ...row!, kind: 0 },
      { ...row!, kind: 1, rank: 2 },
      { ...row!, kind: 2, rank: 3 },
    ]);

    expect(payouts.map((payout) => payout.kind)).toEqual([0, 1, 2]);
  });
});

describe("prize positions", () => {
  it("carry the worth the contract divides an undirected contribution by", () => {
    const mapped = placesFrom([
      { track: "ai", rank: 1, worth: BigInt(3000), frozen: BigInt(2000) },
      { track: "ai", rank: 2, worth: BigInt(1000), frozen: BigInt(1000) },
    ]);

    expect(mapped).toEqual(places());
  });
});
