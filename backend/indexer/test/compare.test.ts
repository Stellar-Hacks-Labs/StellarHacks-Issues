import { describe, expect, it } from "vitest";

import { compare } from "../src/compare.js";
import { divergentState } from "./fixtures.js";

/**
 * A divergent fixture must produce a specific mismatch report.
 *
 * The property under defence is that the report names the fields that differ,
 * not merely that something is wrong. Recovery steps point at those fields.
 */
describe("comparing projections with contract state", () => {
  it("lists every field the divergent fixture disagrees on", () => {
    const fixture = divergentState();
    const report = compare(fixture.projected, fixture.onChain);

    expect(report.ok).toBe(false);
    expect(report.mismatches).toEqual(fixture.expectedMismatches);
  });

  it("reports ok when both sides agree", () => {
    const fixture = divergentState();
    const aligned = {
      ...fixture.projected,
      phase: fixture.onChain.phase,
      submissions: {
        "1": {
          ...fixture.projected.submissions["1"]!,
          uri: fixture.onChain.submissions["1"]!.uri,
        },
      },
    };

    expect(compare(aligned, fixture.onChain)).toEqual({ ok: true, mismatches: [] });
  });
});
