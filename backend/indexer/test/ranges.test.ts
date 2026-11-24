import { describe, expect, it } from "vitest";

import {
  clampToRetention,
  holes,
  merge,
  normalize,
  overlaps,
  paginate,
  width,
} from "../src/ranges.js";

describe("normalising a pasted ledger range", () => {
  it("leaves an already ordered range alone", () => {
    expect(normalize(10, 20)).toEqual({ from: 10, to: 20 });
  });

  it("swaps ends when an operator pastes them backwards", () => {
    expect(normalize(20, 10)).toEqual({ from: 10, to: 20 });
  });
});

describe("measuring and overlapping ranges", () => {
  it("counts a single ledger as width one", () => {
    expect(width({ from: 7, to: 7 })).toBe(1);
  });

  it("treats an inverted range as empty rather than negative", () => {
    expect(width({ from: 9, to: 3 })).toBe(0);
  });

  it("detects a shared ledger between two ranges", () => {
    expect(overlaps({ from: 1, to: 5 }, { from: 5, to: 9 })).toBe(true);
    expect(overlaps({ from: 1, to: 4 }, { from: 5, to: 9 })).toBe(false);
  });
});

describe("merging a cover into a sorted continuum", () => {
  it("collapses overlapping and abutting ranges", () => {
    expect(
      merge([
        { from: 10, to: 20 },
        { from: 15, to: 25 },
        { from: 26, to: 30 },
        { from: 40, to: 41 },
      ]),
    ).toEqual([
      { from: 10, to: 30 },
      { from: 40, to: 41 },
    ]);
  });
});

describe("finding holes inside a claimed span", () => {
  it("returns nothing when the cover fills the span", () => {
    expect(holes({ from: 1, to: 10 }, [{ from: 1, to: 10 }])).toEqual([]);
  });

  it("names every inclusive hole the cover leaves", () => {
    expect(
      holes(
        { from: 1, to: 20 },
        [
          { from: 1, to: 5 },
          { from: 10, to: 12 },
        ],
      ),
    ).toEqual([
      { from: 6, to: 9 },
      { from: 13, to: 20 },
    ]);
  });
});

describe("clamping a range to what RPC still serves", () => {
  it("cuts both ends to the retention window", () => {
    expect(clampToRetention({ from: 1, to: 100 }, 10, 50)).toEqual({ from: 10, to: 50 });
  });

  it("returns null when the whole request sits outside the window", () => {
    expect(clampToRetention({ from: 1, to: 5 }, 10, 50)).toBeNull();
  });
});

describe("paging a re-ingest so one call stays bounded", () => {
  it("splits a wide range into pages of the asked width", () => {
    expect(paginate({ from: 1, to: 5 }, 2)).toEqual([
      { from: 1, to: 2 },
      { from: 3, to: 4 },
      { from: 5, to: 5 },
    ]);
  });

  it("refuses a non-positive page width rather than looping forever", () => {
    expect(paginate({ from: 1, to: 5 }, 0)).toEqual([]);
  });
});
