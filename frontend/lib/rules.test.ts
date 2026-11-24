import { describe, expect, it } from "vitest";

import { CONSTITUTION_VERSION, type MissingJudgeFallback } from "./rules";
import { explain, labelOf } from "./fallback";

describe("missing-judge fallback labels", () => {
  it("names each frozen policy", () => {
    const exclude: MissingJudgeFallback = { kind: "exclude" };
    const floor: MissingJudgeFallback = { kind: "rank-available", floor: 2 };
    const allowance: MissingJudgeFallback = { kind: "reassign", allowance: 1 };

    expect(labelOf(exclude)).toContain("Exclude");
    expect(labelOf(floor)).toContain("2");
    expect(labelOf(allowance)).toContain("1");
    expect(explain(floor)).toContain("scorecards");
  });

  it("tracks the constitution version the contract freezes", () => {
    expect(CONSTITUTION_VERSION).toBe(8);
  });
});
