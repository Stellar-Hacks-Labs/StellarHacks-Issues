import { describe, expect, it } from "vitest";

import { NOTE_LIMIT, draftDeclaration, isRelationship, rowFor } from "./write";

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
const NOW = "2026-11-21T10:00:00.000Z";

function draft(changes: Partial<Parameters<typeof draftDeclaration>[0]> = {}) {
  return draftDeclaration({
    contract: CONTRACT,
    judge: JUDGE,
    team: 3,
    relationship: "mentor",
    note: "  ran their office hours  ",
    now: NOW,
    ...changes,
  });
}

describe("a declaration names a judge, a project and how they know it", () => {
  it("keeps the relationship and trims the note", () => {
    expect(draft()).toEqual({
      contract: CONTRACT,
      judge: JUDGE,
      team: 3,
      relationship: "mentor",
      note: "ran their office hours",
      declaredAt: NOW,
    });
  });

  it("refuses a relationship that is not on the list", () => {
    // The queue filter and the proof page both read this field, so a word
    // neither of them knows would be a declaration that displays and does
    // nothing.
    expect(draft({ relationship: "acquaintance" })).toEqual({ error: "choose how you know this team" });
    expect(isRelationship("mentor")).toBe(true);
    expect(isRelationship("acquaintance")).toBe(false);
  });

  it("requires a description for the relationship the list cannot describe", () => {
    expect(draft({ relationship: "other", note: "   " })).toEqual({ error: "describe the relationship" });
    expect("error" in draft({ relationship: "other", note: "we co-founded a company in 2019" })).toBe(false);
  });

  it("refuses a judge who has not connected the wallet they were named with", () => {
    expect(draft({ judge: "" })).toEqual({
      error: "connect the wallet you were named a judge with",
    });
    expect(draft({ judge: CONTRACT })).toEqual({
      error: "connect the wallet you were named a judge with",
    });
  });

  it("refuses a hackathon address, a project and a time it cannot read", () => {
    expect(draft({ contract: JUDGE })).toEqual({ error: "that is not a hackathon address" });
    expect(draft({ team: 0 })).toEqual({ error: "that is not a project" });
    expect(draft({ team: 1.5 })).toEqual({ error: "that is not a project" });
    expect(draft({ now: "whenever" })).toEqual({ error: "that is not a time" });
  });

  it("refuses a note longer than the column takes", () => {
    expect(draft({ note: "x".repeat(NOTE_LIMIT + 1) })).toEqual({
      error: `keep the note under ${NOTE_LIMIT} characters`,
    });
    expect("error" in draft({ note: "x".repeat(NOTE_LIMIT) })).toBe(false);
  });
});

describe("the row sent to the table", () => {
  it("carries no time of its own", () => {
    const drafted = draft();

    expect("error" in drafted).toBe(false);

    const row = rowFor(drafted as Exclude<typeof drafted, { error: string }>);

    /* `declared_at` is the database's default and never the client's value. A
       judge whose clock is wrong, or who edited the request, must not be able
       to make a late declaration look early — that timestamp is the whole
       evidentiary value of the row. */
    expect(row).toEqual({
      contract_id: CONTRACT,
      judge: JUDGE,
      team_id: 3,
      relationship: "mentor",
      note: "ran their office hours",
    });
  });
});
