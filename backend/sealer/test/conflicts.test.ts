import { describe, expect, it } from "vitest";

import { conflictRefusal, declaredConflict } from "../src/conflicts.js";
import type { DeclarationReader } from "../src/conflict-store.js";

/**
 * The rule a declaration buys, with the table replaced by what it would have
 * said.
 *
 * The question is narrow on purpose: does this judge have a declaration for
 * this team. Everything about whether the card is well formed, sealed or signed
 * is decided elsewhere, and a rule that also knew about those would be a second
 * place for them to be decided slightly differently.
 */

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
const OTHER_JUDGE = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

function declaring(
  rows: Record<string, { team: number; relationship: string }[]>,
): DeclarationReader {
  return async (contract, judge) => rows[`${contract}:${judge}`] ?? [];
}

describe("a judge who declared a conflict", () => {
  it("cannot have a card counted for that team", async () => {
    const read = declaring({
      [`${CONTRACT}:${JUDGE}`]: [{ team: 3, relationship: "mentor" }],
    });

    expect(await declaredConflict(CONTRACT, JUDGE, 3, read)).toBe("mentor");
  });

  it("can still score every other team", async () => {
    const read = declaring({
      [`${CONTRACT}:${JUDGE}`]: [{ team: 3, relationship: "mentor" }],
    });

    expect(await declaredConflict(CONTRACT, JUDGE, 4, read)).toBeNull();
  });

  it("blocks nobody else's card", async () => {
    const read = declaring({
      [`${CONTRACT}:${JUDGE}`]: [{ team: 3, relationship: "teammate" }],
    });

    // Two judges on the same project is the ordinary case, and one of them
    // declaring says nothing about the other.
    expect(await declaredConflict(CONTRACT, OTHER_JUDGE, 3, read)).toBeNull();
  });

  it("is scoped to the hackathon it was declared for", async () => {
    const elsewhere = "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE";
    const read = declaring({
      [`${CONTRACT}:${JUDGE}`]: [{ team: 3, relationship: "employer" }],
    });

    // The same judge may mentor a team at one event and judge a different team
    // numbered three at another; team numbers are per hackathon.
    expect(await declaredConflict(elsewhere, JUDGE, 3, read)).toBeNull();
  });
});

describe("a team number that is not one", () => {
  it("is refused without asking the table", async () => {
    let asked = 0;
    const read: DeclarationReader = async () => {
      asked += 1;

      return [];
    };

    expect(await declaredConflict(CONTRACT, JUDGE, 0, read)).toBeNull();
    expect(await declaredConflict(CONTRACT, JUDGE, 1.5, read)).toBeNull();
    expect(asked).toBe(0);
  });
});

describe("a read that failed", () => {
  it("is not an all clear", async () => {
    const read: DeclarationReader = async () => {
      throw new Error("could not read the conflict declarations: no route to host");
    };

    // The alternative is a service that counts a conflicted card whenever its
    // database is unreachable, which is the one moment it cannot tell.
    await expect(declaredConflict(CONTRACT, JUDGE, 3, read)).rejects.toThrowError(
      /could not read the conflict declarations/,
    );
  });
});

describe("the refusal", () => {
  it("names the relationship the judge declared", () => {
    // The console matches on this wording to explain itself, so it is pinned
    // here rather than left to whichever route composed it.
    expect(conflictRefusal("investor")).toBe("a conflict was declared for this project (investor)");
  });
});
