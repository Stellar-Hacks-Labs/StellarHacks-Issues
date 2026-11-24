import { describe, expect, it } from "vitest";

import {
  countUniqueEvents,
  MAX_REINGEST_PAGE,
  overlapEventCount,
} from "../src/reingest.js";
import { duplicateRange } from "./fixtures.js";

/**
 * Re-ingesting a range twice must not invent duplicate identities.
 *
 * The store upserts on (contract, ledger, event_index). This suite proves the
 * accounting that makes a second pass report a full overlap rather than new
 * rows, which is the acceptance criterion the issue names.
 */
describe("re-ingesting a range twice", () => {
  it("counts the same events once across two identical passes", () => {
    const fixture = duplicateRange();

    expect(countUniqueEvents([fixture.first, fixture.second])).toBe(2);
    expect(overlapEventCount([fixture.first], [fixture.second])).toBe(2);
  });

  it("treats a perfect second pass as zero new identities", () => {
    const fixture = duplicateRange();
    const firstCount = countUniqueEvents([fixture.first]);
    const combined = countUniqueEvents([fixture.first, fixture.second]);

    expect(combined - firstCount).toBe(0);
  });

  it("keeps a re-ingest page inside a bounded width", () => {
    expect(MAX_REINGEST_PAGE).toBeLessThanOrEqual(10_000);
    expect(MAX_REINGEST_PAGE).toBeGreaterThan(0);
  });
});
