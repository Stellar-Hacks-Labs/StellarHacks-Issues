import { describe, expect, it } from "vitest";
import { visitor } from "./roles";

describe("a visitor cannot read a private search row", () => {
  it("selects nothing when the only inserted row is private", async () => {
    const { data, error } = await visitor().from("search_documents").select("id").eq("visibility", "private");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });
});
