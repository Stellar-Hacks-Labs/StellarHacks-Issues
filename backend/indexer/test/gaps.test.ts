import { describe, expect, it } from "vitest";

import { detectGaps } from "../src/gaps.js";
import { contiguous, gapped, rpcRetentionEdge } from "./fixtures.js";

/**
 * Gap detection against a claimed cursor and what was actually covered.
 *
 * The property under defence is that a hole in the scan cover is named, and a
 * continuous cover is not. Without that, recovery cannot tell a quiet contract
 * from a missed range.
 */
describe("detecting gaps against the cursor", () => {
  it("reports nothing when the cover is contiguous through the cursor", () => {
    const fixture = contiguous();

    expect(
      detectGaps({
        covered: fixture.covered,
        cursor: fixture.cursor,
        oldestRpc: fixture.oldestRpc,
      }),
    ).toEqual(fixture.expectedGaps);
  });

  it("names the missing ledger span between two covered clumps", () => {
    const fixture = gapped();

    expect(
      detectGaps({
        covered: fixture.covered,
        cursor: fixture.cursor,
        oldestRpc: fixture.oldestRpc,
        origin: fixture.origin,
      }),
    ).toEqual(fixture.expectedGaps);
  });

  it("flags a cursor older than anything RPC still serves as behind retention", () => {
    const fixture = rpcRetentionEdge();

    expect(
      detectGaps({
        covered: fixture.covered,
        cursor: fixture.cursor,
        oldestRpc: fixture.oldestRpc,
        origin: fixture.origin,
      }),
    ).toEqual(fixture.expectedGaps);
  });
});
