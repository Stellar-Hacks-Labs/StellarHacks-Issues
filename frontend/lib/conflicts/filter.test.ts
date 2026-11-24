import { describe, expect, it } from "vitest";

import { isConflicted, queueNotice, withoutConflicts } from "./filter";
import { fromRows } from "./read";

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";

const entries = [{ team: 1 }, { team: 2 }, { team: 3 }, { team: 4 }];

function declarations(teams: number[]) {
  return fromRows(
    teams.map((team) => ({
      contract_id: CONTRACT,
      judge: JUDGE,
      team_id: team,
      relationship: "mentor",
      note: "",
      declared_at: "2026-11-21T10:00:00Z",
    })),
  ).declarations;
}

describe("a judge's queue", () => {
  it("sets aside the projects they declared and keeps the rest in order", () => {
    const queue = withoutConflicts(entries, declarations([2, 4]));

    expect(queue.scoreable.map((entry) => entry.team)).toEqual([1, 3]);
    expect(queue.setAside.map((entry) => entry.team)).toEqual([2, 4]);
  });

  it("is untouched when nothing was declared", () => {
    const queue = withoutConflicts(entries, []);

    expect(queue.scoreable).toHaveLength(entries.length);
    expect(queue.setAside).toEqual([]);
  });

  it("can be entirely set aside", () => {
    // A judge who declares everything is not an error state: they have said
    // they cannot score this event, and the queue should say so rather than
    // show them a sheet.
    const queue = withoutConflicts(entries, declarations([1, 2, 3, 4]));

    expect(queue.scoreable).toEqual([]);
    expect(queue.setAside).toHaveLength(4);
  });

  it("ignores a declaration for a project that is not in the queue", () => {
    const queue = withoutConflicts(entries, declarations([9]));

    expect(queue.scoreable.map((entry) => entry.team)).toEqual([1, 2, 3, 4]);
    expect(queue.setAside).toEqual([]);
  });
});

describe("whether one project is conflicted", () => {
  it("is asked per team", () => {
    const declared = declarations([3]);

    expect(isConflicted(declared, 3)).toBe(true);
    expect(isConflicted(declared, 4)).toBe(false);
    expect(isConflicted([], 3)).toBe(false);
  });
});

describe("the notice above the queue", () => {
  it("counts whole projects and says who reassigns them", () => {
    expect(queueNotice(withoutConflicts(entries, declarations([2])))).toBe(
      "1 project you declared a conflict with is set aside. The organizer reassigns it.",
    );
    expect(queueNotice(withoutConflicts(entries, declarations([2, 3])))).toContain("2 projects");
  });

  it("says nothing at all when there is nothing to say", () => {
    expect(queueNotice(withoutConflicts(entries, []))).toBeNull();
  });
});
