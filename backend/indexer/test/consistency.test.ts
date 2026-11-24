import { describe, expect, it } from "vitest";

import { compare } from "../src/compare.js";
import { describeCheck } from "../src/consistency.js";
import { divergentState } from "./fixtures.js";

/**
 * Consistency orchestration wording and the divergent report it must carry.
 *
 * Persistence and RPC live behind the run helper; this suite pins the message
 * an operator sees when the pure comparison finds a mismatch.
 */
describe("describing a consistency run", () => {
  it("includes the mismatch count from a divergent fixture", () => {
    const fixture = divergentState();
    const report = compare(fixture.projected, fixture.onChain);
    const text = describeCheck({ report, checkedAt: "2026-11-21T01:00:00.000Z" });

    expect(text).toContain("2026-11-21T01:00:00.000Z");
    expect(text).toContain("2 mismatch");
    expect(text).toContain("hackathon_state.state.phase");
    expect(text).toContain("submissions.team:1.uri");
  });
});
