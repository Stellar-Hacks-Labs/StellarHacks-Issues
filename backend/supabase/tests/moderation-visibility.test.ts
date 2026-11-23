import { describe, expect, it } from "vitest";
import { visitor } from "./roles";

describe("a visitor cannot read decisions", () => {
  it("selects none", async () => {
    const { data } = await visitor().from("moderation_decisions").select("id");
    expect(data ?? []).toEqual([]);
  });
});
