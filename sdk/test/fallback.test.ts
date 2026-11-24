import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  admitsToRanking,
  labelFallback,
  rankedUnderFallback,
  scoresRequired,
  type MissingJudgeFallback,
} from "../src/fallback.js";
import { rankTrack, type ProjectData } from "../src/results.js";
import { canonicalConstitution } from "./canonical.js";

function fallbackRanking(): {
  topVotes: number;
  projects: ProjectData[];
  expected: { rank: number; team: number; underFallback: boolean }[];
} {
  const path = join(import.meta.dirname, "..", "..", "fixtures", "ranking-fallback.txt");
  const lines = readFileSync(path, "utf8").trim().split("\n");

  let topVotes = 0;
  const projects: ProjectData[] = [];
  const expected: { rank: number; team: number; underFallback: boolean }[] = [];

  for (const line of lines) {
    const fields = Object.fromEntries(
      line
        .split(" ")
        .slice(line.startsWith("top_weight") ? 0 : 1)
        .map((pair) => pair.split("=") as [string, string]),
    );

    if (line.startsWith("top_weight")) {
      topVotes = Number(fields["top_weight"]);
    } else if (line.startsWith("project")) {
      projects.push({
        team: Number(fields["team"]),
        track: fields["track"]!,
        submittedAt: BigInt(fields["submitted_at"]!),
        valid: fields["valid"] === "1",
        scores: { count: Number(fields["score_count"]), total: BigInt(fields["score_total"]!) },
        votes: Number(fields["weight"]),
        criterionTallies: {},
      });
    } else {
      expected.push({
        rank: Number(fields["rank"]),
        team: Number(fields["team"]),
        underFallback: fields["under_fallback"] === "1",
      });
    }
  }

  return { topVotes, projects, expected };
}

describe("missing-judge fallback arithmetic", () => {
  it("asks for the full quorum under Exclude", () => {
    const policy: MissingJudgeFallback = { tag: "Exclude", values: undefined };

    expect(scoresRequired(policy, 3)).toBe(3);
    expect(admitsToRanking(2, 3, policy, true)).toBe(false);
    expect(admitsToRanking(3, 3, policy, true)).toBe(true);
  });

  it("admits a project at a RankAvailable floor", () => {
    const policy: MissingJudgeFallback = { tag: "RankAvailable", values: [2] };

    expect(scoresRequired(policy, 3)).toBe(2);
    expect(admitsToRanking(2, 3, policy, true)).toBe(true);
    expect(rankedUnderFallback(2, 3, true)).toBe(true);
    expect(rankedUnderFallback(3, 3, true)).toBe(false);
  });

  it("admits a shortfall inside a Reassign allowance", () => {
    const policy: MissingJudgeFallback = { tag: "Reassign", values: [1] };

    expect(scoresRequired(policy, 3)).toBe(2);
    expect(admitsToRanking(2, 3, policy, true)).toBe(true);
    expect(admitsToRanking(1, 3, policy, true)).toBe(false);
  });

  it("labels each policy for the rules page", () => {
    expect(labelFallback({ tag: "Exclude", values: undefined })).toContain("Exclude");
    expect(labelFallback({ tag: "RankAvailable", values: [2] })).toContain("2");
    expect(labelFallback({ tag: "Reassign", values: [1] })).toContain("1");
  });
});

describe("recomputing a ranking under RankAvailable", () => {
  const { topVotes, projects, expected } = fallbackRanking();

  it("reaches the order and fallback marks the shared fixture records", () => {
    const constitution = {
      ...canonicalConstitution(),
      missing_judge_fallback: { tag: "RankAvailable" as const, values: [2] as const },
    };

    const placements = rankTrack(constitution, "payments", projects, topVotes);

    expect(placements.map((placement) => [placement.rank, placement.team, placement.under_fallback])).toEqual(
      expected.map((row) => [row.rank, row.team, row.underFallback]),
    );
  });
});
