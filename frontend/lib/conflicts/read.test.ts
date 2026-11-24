import { describe, expect, it } from "vitest";

import { declarationsBy, declaredTeams, fromRows, ordered } from "./read";

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
const OTHER = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

function row(changes: Record<string, unknown> = {}) {
  return {
    contract_id: CONTRACT,
    judge: JUDGE,
    team_id: 3,
    relationship: "mentor",
    note: "office hours",
    declared_at: "2026-11-21T10:00:00+00:00",
    ...changes,
  };
}

describe("rows from the table", () => {
  it("become declarations with a normalized time", () => {
    const { declarations, unreadable } = fromRows([row()]);

    expect(unreadable).toBe(0);
    expect(declarations).toEqual([
      {
        contract: CONTRACT,
        judge: JUDGE,
        team: 3,
        relationship: "mentor",
        note: "office hours",
        declaredAt: "2026-11-21T10:00:00.000Z",
      },
    ]);
  });

  it("drop a row this version cannot read, and say how many", () => {
    // Each of these would otherwise reach a page that either hides a project or
    // publishes a claim about a named judge. Showing less than the truth is
    // recoverable; showing something that is not the truth is not.
    const { declarations, unreadable } = fromRows([
      row(),
      row({ relationship: "acquaintance" }),
      row({ team_id: "three" }),
      row({ team_id: 0 }),
      row({ declared_at: "whenever" }),
      row({ judge: 42 }),
    ]);

    expect(declarations).toHaveLength(1);
    expect(unreadable).toBe(5);
  });

  it("treat a missing note as an empty one", () => {
    expect(fromRows([row({ note: null })]).declarations[0]?.note).toBe("");
  });
});

describe("the order declarations are read in", () => {
  it("is oldest first, so the list reads as a sequence", () => {
    const { declarations } = fromRows([
      row({ team_id: 5, declared_at: "2026-11-21T12:00:00Z" }),
      row({ team_id: 2, declared_at: "2026-11-21T09:00:00Z" }),
      row({ team_id: 1, judge: OTHER, declared_at: "2026-11-21T09:00:00Z" }),
    ]);

    expect(declarations.map((declaration) => [declaration.team, declaration.judge])).toEqual([
      [1, OTHER],
      [2, JUDGE],
      [5, JUDGE],
    ]);
    expect(ordered(declarations)).toEqual(declarations);
  });
});

describe("a judge's own declarations", () => {
  it("are the only ones their console shows", () => {
    const { declarations } = fromRows([row({ team_id: 3 }), row({ team_id: 4, judge: OTHER })]);

    expect(declarationsBy(JUDGE, declarations).map((one) => one.team)).toEqual([3]);
    expect(declarationsBy(OTHER, declarations).map((one) => one.team)).toEqual([4]);
    expect(declaredTeams(declarations)).toEqual(new Set([3, 4]));
  });
});
