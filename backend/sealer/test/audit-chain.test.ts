import { describe, expect, it } from "vitest";
import { nextEntry, verifyAuditChain } from "../src/audit/chain.js";

describe("audit chain", () => {
  it("breaks verification at the first altered entry", () => {
    const first = nextEntry({ previous: null, contract: "C", action: "scorecard", outcome: "accepted", subjectHash: "a".repeat(64), recordedAt: "2026-01-01T00:00:00.000Z" });
    const second = nextEntry({ previous: first, contract: "C", action: "ballot", outcome: "accepted", subjectHash: "b".repeat(64), recordedAt: "2026-01-01T00:00:01.000Z" });
    expect(verifyAuditChain([first, second])).toBe(true);
    expect(verifyAuditChain([{ ...first, action: "changed" }, second])).toBe(false);
  });
});
