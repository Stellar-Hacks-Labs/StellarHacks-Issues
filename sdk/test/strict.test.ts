import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { toHex } from "../src/hex.js";
import { commitmentMatches, scorecardCommitment } from "../src/strict.js";
import { canonicalScorecard } from "./canonical.js";

function fixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "..", "..", "fixtures", name), "utf8").trim();
}

/** The salt both languages use for the committed fixture. */
const CANONICAL_SALT = new Uint8Array(16).fill(0x11);

describe("strict-mode commitments", () => {
  it("reaches the digest the contract stored", () => {
    expect(toHex(scorecardCommitment(canonicalScorecard(), CANONICAL_SALT))).toBe(
      fixture("scorecard-commitment.sha256"),
    );
  });

  it("moves when a mark moves", () => {
    const original = toHex(scorecardCommitment(canonicalScorecard(), CANONICAL_SALT));
    const changed = canonicalScorecard();
    changed.scores[0]!.score = 99;

    expect(toHex(scorecardCommitment(changed, CANONICAL_SALT))).not.toBe(original);
  });

  it("moves when the salt moves", () => {
    const original = toHex(scorecardCommitment(canonicalScorecard(), CANONICAL_SALT));
    const other = new Uint8Array(16).fill(0x22);

    expect(toHex(scorecardCommitment(canonicalScorecard(), other))).not.toBe(original);
  });

  it("accepts only the opening that was committed", () => {
    const card = canonicalScorecard();
    const commitment = scorecardCommitment(card, CANONICAL_SALT);

    expect(commitmentMatches(card, CANONICAL_SALT, commitment)).toBe(true);
    expect(commitmentMatches(card, new Uint8Array(16).fill(0x22), commitment)).toBe(false);

    const forged = canonicalScorecard();
    forged.scores[0]!.score = 1;
    expect(commitmentMatches(forged, CANONICAL_SALT, commitment)).toBe(false);
  });
});
