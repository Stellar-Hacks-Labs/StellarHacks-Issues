import { describe, expect, it } from "vitest";

import { toHex } from "../src/hex.js";
import { commitmentMatches, scorecardCommitment } from "../src/strict.js";
import { canonicalScorecard } from "./canonical.js";

const SALT = new Uint8Array(16).fill(0x11);

describe("strict-mode adversarial openings", () => {
  /**
   * A withheld disclose is what the strict mode trades the sealer for. The
   * commitment stays, the tally never sees the card, and a client that only
   * compared opened scores would miss the omission.
   */
  it("a commitment with no matching disclose is detectable as a leftover digest", () => {
    const card = canonicalScorecard();
    const commitment = scorecardCommitment(card, SALT);

    // Nothing opens it. The digest is still there to be compared against an
    // empty score list for that judge.
    expect(toHex(commitment)).toHaveLength(64);
    expect(commitmentMatches(card, new Uint8Array(16).fill(0x00), commitment)).toBe(false);
  });

  it("an improved card after commit cannot open the posted digest", () => {
    const posted = canonicalScorecard();
    const commitment = scorecardCommitment(posted, SALT);

    const improved = canonicalScorecard();
    improved.scores[0]!.score = 100;
    improved.scores[1]!.score = 100;

    expect(commitmentMatches(improved, SALT, commitment)).toBe(false);
  });
});
