import { describe, expect, it } from "vitest";
import { OPEN_LISTING } from "./fixtures";
import { filterListings } from "./listings";

describe("an unregistered reader cannot see listings", () => {
  it("drops a listing whose reader id is missing", () => {
    const hidden = { ...OPEN_LISTING, readerId: null };
    expect(filterListings([hidden, OPEN_LISTING], null).map((listing) => listing.id)).toEqual(["list-1"]);
  });

  it("filters by a skill the listing actually named", () => {
    expect(filterListings([OPEN_LISTING], "design")).toEqual([]);
    expect(filterListings([OPEN_LISTING], "soroban")).toHaveLength(1);
  });
});
