import { describe, expect, it } from "vitest";

import { checkRankings, recomputeRankings } from "../../src/verify/ranking.js";
import { loadReference, loadTampered } from "./fixtures.js";

describe("ranking recomputes from public project data", () => {
  it("agrees with the reference rankings", async () => {
    const loaded = await loadReference();
    const derived = recomputeRankings({
      constitution: loaded.constitution,
      projects: loaded.projects,
      topVotes: loaded.topVotes,
    });

    expect(derived["payments"]?.map((row) => row.team)).toEqual(
      loaded.rankings["payments"]?.map((row) => row.team),
    );

    const checks = checkRankings(
      {
        constitution: loaded.constitution,
        projects: loaded.projects,
        topVotes: loaded.topVotes,
      },
      { rankings: loaded.rankings },
    );
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("names the payments disagreement on a swapped fixture", async () => {
    const loaded = await loadTampered();
    const checks = checkRankings(
      {
        constitution: loaded.constitution,
        projects: loaded.projects,
        topVotes: loaded.topVotes,
      },
      { rankings: loaded.rankings },
    );

    const payments = checks.find((check) => check.name === "ranking.payments");
    expect(payments?.ok).toBe(false);
  });
});
