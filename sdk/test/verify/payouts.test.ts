import { describe, expect, it } from "vitest";

import { checkPayouts, recomputePayouts, splitEvenly } from "../../src/verify/payouts.js";
import { recomputeRankings } from "../../src/verify/ranking.js";
import { loadReference } from "./fixtures.js";

describe("payouts follow the prize table and even shares", () => {
  it("matches the reference payout amounts and shares", async () => {
    const loaded = await loadReference();
    const rankings = recomputeRankings({
      constitution: loaded.constitution,
      projects: loaded.projects,
      topVotes: loaded.topVotes,
    });

    const expected = recomputePayouts(loaded.constitution, rankings, loaded.payouts);
    expect(expected.find((row) => row.track === "payments" && row.rank === 1)?.amount).toBe(5000n);

    const checks = checkPayouts(loaded.constitution, rankings, loaded.payouts);
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("gives remainder units to the earliest members", () => {
    expect(splitEvenly(5_000n, 3)).toEqual([1667n, 1667n, 1666n]);
  });
});
