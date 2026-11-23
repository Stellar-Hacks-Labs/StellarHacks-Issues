import { describe, expect, it } from "vitest";
import { visitor } from "./roles";

describe("the moderation queue is not public", () => {
  it("does not return reports to a signed-out visitor", async () => {
    const { data } = await visitor().from("content_reports").select("id");
    expect(data ?? []).toEqual([]);
  });
});
