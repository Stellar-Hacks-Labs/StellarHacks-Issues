import { describe, expect, it } from "vitest";

import { readDeclarations, type DeclarationQuery } from "../src/conflict-store.js";

/**
 * What the table hands back, and what that has to become before the rule above
 * it compares anything.
 *
 * PostgREST returns an integer column as whatever the driver decided, and the
 * rule compares team numbers. A team that arrived as the string "3" and is
 * compared against the number 3 finds no conflict, which is a silent failure in
 * the one direction that matters.
 */

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";

function answering(rows: Record<string, unknown>[]): DeclarationQuery {
  return async () => ({ data: rows, error: null });
}

describe("a declaration row", () => {
  it("becomes a team number and a relationship whatever the driver sent", async () => {
    const read = readDeclarations(
      answering([
        { team_id: "3", relationship: "mentor" },
        { team_id: 7, relationship: "family" },
      ]),
    );

    expect(await read(CONTRACT, JUDGE)).toEqual([
      { team: 3, relationship: "mentor" },
      { team: 7, relationship: "family" },
    ]);
  });

  it("is asked for by hackathon and judge together", async () => {
    const asked: string[] = [];
    const read = readDeclarations(async (contract, judge) => {
      asked.push(`${contract}:${judge}`);

      return { data: [], error: null };
    });

    await read(CONTRACT, JUDGE);

    expect(asked).toEqual([`${CONTRACT}:${JUDGE}`]);
  });
});

describe("an empty answer", () => {
  it("is no conflicts rather than an error", async () => {
    expect(await readDeclarations(answering([]))(CONTRACT, JUDGE)).toEqual([]);
    expect(
      await readDeclarations(async () => ({ data: null, error: null }))(CONTRACT, JUDGE),
    ).toEqual([]);
  });
});

describe("a failed read", () => {
  it("throws with what the database said", async () => {
    const read = readDeclarations(async () => ({
      data: null,
      error: { message: "permission denied for table conflict_declarations" },
    }));

    await expect(read(CONTRACT, JUDGE)).rejects.toThrowError(/permission denied/);
  });
});
