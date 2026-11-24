import { describe, expect, it } from "vitest";

import { checkBallotTallies, tallyBallots } from "../../src/verify/ballots.js";
import { loadReference } from "./fixtures.js";

describe("ballot tallies recount from disclosures", () => {
  it("reaches the published weights and top count", async () => {
    const loaded = await loadReference();
    const tally = tallyBallots(loaded.disclosures);

    expect(tally.weights).toEqual(loaded.voteWeights);
    expect(tally.topVotes).toBe(loaded.topVotes);

    const checks = checkBallotTallies(
      loaded.disclosures,
      loaded.voteWeights,
      loaded.constitution,
    );
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("flags a weight the disclosure does not support", async () => {
    const loaded = await loadReference();
    const checks = checkBallotTallies(loaded.disclosures, { 1: 99, 2: 7 }, loaded.constitution);

    expect(checks.some((check) => !check.ok)).toBe(true);
  });
});
