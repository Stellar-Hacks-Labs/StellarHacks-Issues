import { describe, expect, it } from "vitest";
import { OPEN_LISTING } from "./fixtures";
import { overlap, rankListings } from "./match";

describe("overlap orders the board and does not form a team", () => {
  it("counts only skills both sides named", () => {
    expect(overlap(OPEN_LISTING, ["frontend", "writing"])).toBe(1);
    const other = { ...OPEN_LISTING, id: "list-2", teamId: 2, skills: ["writing"] };
    expect(rankListings([other, OPEN_LISTING], ["soroban", "frontend"]).map((listing) => listing.id)).toEqual(["list-1", "list-2"]);
  });
});
