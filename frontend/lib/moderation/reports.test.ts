import { describe, expect, it } from "vitest";
import { draftReport } from "./reports";

describe("a report names a target and a known category", () => {
  it("refuses a signed-out reporter and an invented category", () => {
    expect(draftReport({ target: { type: "project", id: "p" }, category: "spam", note: "x", reporterId: "", now: "t" })).toEqual({ error: "sign in to report" });
    const made = draftReport({ target: { type: "profile", id: "ada" }, category: "impersonation", note: "not ada", reporterId: "r", now: "t" });
    expect("error" in made).toBe(false);
  });
});
