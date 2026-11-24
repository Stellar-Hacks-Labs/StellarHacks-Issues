import { describe, expect, it } from "vitest";

import { fromRows } from "./read";
import { REVEAL_PHASE, countsByTeam, publishable, publishedNotice } from "./publish";

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
const OTHER = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

const declared = fromRows([
  { contract_id: CONTRACT, judge: JUDGE, team_id: 3, relationship: "mentor", note: "", declared_at: "2026-11-21T10:00:00Z" },
  { contract_id: CONTRACT, judge: OTHER, team_id: 3, relationship: "family", note: "", declared_at: "2026-11-21T11:00:00Z" },
  { contract_id: CONTRACT, judge: JUDGE, team_id: 5, relationship: "investor", note: "", declared_at: "2026-11-21T12:00:00Z" },
]).declarations;

describe("publishing declarations", () => {
  it("withholds them until the reveal, and says why", () => {
    for (const phase of [null, 0, 2, 4]) {
      const published = publishable(phase, declared);

      expect(published.declarations).toEqual([]);
      expect(published.withheld).toContain("published with the scores at the reveal");
    }
  });

  it("opens them from the reveal onwards, in order", () => {
    for (const phase of [REVEAL_PHASE, 6, 7, 8]) {
      const published = publishable(phase, declared);

      expect(published.withheld).toBeNull();
      expect(published.declarations.map((one) => one.declaredAt)).toEqual([
        "2026-11-21T10:00:00.000Z",
        "2026-11-21T11:00:00.000Z",
        "2026-11-21T12:00:00.000Z",
      ]);
    }
  });

  it("publishes an empty list at the reveal when nobody declared", () => {
    const published = publishable(REVEAL_PHASE, []);

    // An empty list after the reveal is a fact about the event, not a gap, and
    // the page says so rather than hiding the section.
    expect(published).toEqual({ declarations: [], withheld: null });
  });
});

describe("the count beside a project", () => {
  it("is per project rather than per judge", () => {
    expect(countsByTeam(declared)).toEqual(new Map([[3, 2], [5, 1]]));
    expect(countsByTeam([])).toEqual(new Map());
  });
});

describe("the notice above the published list", () => {
  it("says what the list is evidence of, and what it is not", () => {
    const said = publishedNotice(declared);

    expect(said).toContain("3 declarations from 2 judges");
    expect(said).toContain("recorded before the scores opened");
    expect(said).toContain("not a check that every conflict was declared");
  });

  it("reads as a sentence for one declaration and for none", () => {
    expect(publishedNotice([declared[0]!])).toContain("1 declaration from 1 judge");
    expect(publishedNotice([])).toBe("No judge declared a conflict with any project at this event.");
  });
});
