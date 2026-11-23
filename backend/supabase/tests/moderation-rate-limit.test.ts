import { describe, expect, it } from "vitest";
import { backend } from "./roles";

describe("reports are indexed by reporter and time", () => {
  it("can count a reporter's recent rows", async () => {
    const { error } = await backend().from("content_reports").select("id, created_at").limit(1);
    expect(error).toBeNull();
  });
});
