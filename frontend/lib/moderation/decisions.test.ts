import { describe, expect, it } from "vitest";
import { decide } from "./decisions";

describe("a decision records who, when, and why", () => {
  it("refuses staff-less, reason-less, and unnamed actions", () => {
    expect(decide({ reportId: "r", action: "hide", actorId: "s", at: "t", reason: "because", staff: false })).toEqual({ error: "staff only" });
    expect(decide({ reportId: "r", action: "hide", actorId: "s", at: "t", reason: "  ", staff: true })).toEqual({ error: "a decision needs a reason" });
    const made = decide({ reportId: "r", action: "hide", actorId: "s", at: "2026-11-21T11:00:00Z", reason: "spam", staff: true });
    expect(made).toMatchObject({ actorId: "s", at: "2026-11-21T11:00:00Z", reason: "spam" });
  });
});
