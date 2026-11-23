import { describe, expect, it } from "vitest";
import { visitor } from "./roles";

describe("an anonymous reader cannot select team listings", () => {
  it("is rejected by row level security", async () => {
    const { data, error } = await visitor().from("team_listings").select("id");
    expect(data ?? []).toEqual([]);
    expect(error === null || error.code === "42501").toBe(true);
  });
});
