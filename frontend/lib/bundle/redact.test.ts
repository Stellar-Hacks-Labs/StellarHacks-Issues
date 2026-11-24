import { describe, expect, it } from "vitest";

import { redactRecord } from "./redact";

describe("redactRecord", () => {
  it("drops ciphertext and tlock fields so an unrevealed envelope never ships", () => {
    const cleaned = redactRecord({
      judge: "GABC",
      team_id: 1,
      ciphertext: "deadbeef",
      tlock_round: 42,
      tlock_commitment: "aa",
      scores: [10, 20],
      feedback: "secret until reveal",
    });

    expect(cleaned).toEqual({ judge: "GABC", team_id: 1 });
    expect(cleaned).not.toHaveProperty("ciphertext");
    expect(cleaned).not.toHaveProperty("scores");
  });

  it("leaves revealed public fields alone when no sealed envelope is present", () => {
    expect(
      redactRecord({
        name: "ScoreRevealed",
        payload: { judge: "GABC", team: 1, weighted: 900_000 },
      }),
    ).toEqual({
      name: "ScoreRevealed",
      payload: { judge: "GABC", team: 1, weighted: 900_000 },
    });
  });
});
