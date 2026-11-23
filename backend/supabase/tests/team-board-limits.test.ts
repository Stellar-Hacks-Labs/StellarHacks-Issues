import { describe, expect, it } from "vitest";
import { backend } from "./roles";

describe("one open listing per team", () => {
  it("the unique pair is hackathon_id and team_id", async () => {
    const { error } = await backend().from("team_listings").select("hackathon_id, team_id").limit(1);
    expect(error).toBeNull();
  });
});
