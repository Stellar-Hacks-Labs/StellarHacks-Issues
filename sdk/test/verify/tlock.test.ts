import { describe, expect, it } from "vitest";

import {
  checkClaimedRound,
  firstRoundAtOrAfter,
  QUICKNET_GENESIS_TIME,
  QUICKNET_PERIOD,
} from "../../src/verify/tlock.js";
import { loadReference } from "./fixtures.js";

describe("tlock round follows the locked judging deadline", () => {
  it("agrees with the reference claimed round", async () => {
    const loaded = await loadReference();
    expect(loaded.tlock).toBeDefined();

    const check = checkClaimedRound(
      loaded.tlock!.judgingClosesAt,
      loaded.tlock!.claimedRound,
    );
    expect(check.ok).toBe(true);
  });

  it("advances when the deadline falls between beacons", () => {
    const genesis = QUICKNET_GENESIS_TIME;
    const period = QUICKNET_PERIOD;
    // Exactly on a beacon boundary: round n publishes at genesis + (n-1)*period.
    const onBoundary = genesis + 9 * period;
    expect(firstRoundAtOrAfter(onBoundary, genesis, period)).toBe(10);

    // One second after that beacon: the next round is required.
    expect(firstRoundAtOrAfter(onBoundary + 1, genesis, period)).toBe(11);
  });

  it("disagrees when the claimed round is early", () => {
    const check = checkClaimedRound(1_700_000_000, 1);
    expect(check.ok).toBe(false);
    expect(check.expectedRound).toBeGreaterThan(1);
  });
});
