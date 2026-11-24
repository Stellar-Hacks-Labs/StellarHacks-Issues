import { describe, expect, it } from "vitest";

import { FORBIDDEN_FIELDS, REVEAL_PHASE, privateFieldsIn, revealed, withoutScores } from "./visibility";

describe("whether an event has revealed", () => {
  it("is phase five onwards, in the contract's own numbering", () => {
    expect(REVEAL_PHASE).toBe(5);
    for (const phase of [null, 0, 1, 2, 3, 4]) {
      expect(revealed(phase), String(phase)).toBe(false);
    }
    for (const phase of [5, 6, 7, 8]) {
      expect(revealed(phase), String(phase)).toBe(true);
    }
  });
});

describe("a placement before the reveal", () => {
  const placement = {
    rank: 1,
    team: 3,
    finalScore: 8_000,
    judgeAverage: 7_500,
    community: 500,
    decidedBy: 0,
    paidAmount: null,
    paidTxHash: null,
  };

  it("keeps the placing and nulls every score", () => {
    // The ranking is the contract's and public once it exists; the numbers
    // behind it are sealed until the reveal, and a zero here would be read as a
    // score rather than as an absence.
    expect(withoutScores(placement)).toEqual({
      ...placement,
      finalScore: null,
      judgeAverage: null,
      community: null,
      decidedBy: null,
    });
  });

  it("leaves a payment alone, which is a ledger fact rather than a score", () => {
    const paid = { ...placement, paidAmount: "3000", paidTxHash: "ab".repeat(32) };

    expect(withoutScores(paid).paidAmount).toBe("3000");
    expect(withoutScores(paid).paidTxHash).toBe("ab".repeat(32));
  });
});

describe("private fields", () => {
  it("are looked for by name, however deeply they are nested", () => {
    const payload = {
      items: [
        { team: 1, title: "fine" },
        { team: 2, title: "leaky", owner: { email: "someone@example.invalid" } },
      ],
    };

    expect(privateFieldsIn(payload)).toEqual(["$.items[1].owner.email"]);
  });

  it("finds nothing in a payload that carries none", () => {
    expect(privateFieldsIn({ items: [{ team: 1, title: "fine" }], nextCursor: null })).toEqual([]);
  });

  it("names the ones that must never appear, including the sealed columns", () => {
    for (const field of ["email", "profile_id", "country", "scores", "ciphertext", "signature", "leaf"]) {
      expect(FORBIDDEN_FIELDS).toContain(field);
    }
  });

  it("looks through arrays at the top level too", () => {
    expect(privateFieldsIn([{ walletAddress: "GABC" }])).toEqual(["$[0].walletAddress"]);
  });
});
