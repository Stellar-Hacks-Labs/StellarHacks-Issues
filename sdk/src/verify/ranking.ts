import type { Constitution, Placement } from "hackathon-core";

import { rankTrack, type ProjectData } from "../results.js";
import { tallyBallots } from "./ballots.js";
import { compareCheck, type Check } from "./compare.js";
import type { Disclosures } from "./disclosures.js";

/**
 * Recompute each track's ranking from public project data and disclosed votes.
 *
 * This is the check the whole verifier exists for: given the locked rules and
 * the revealed inputs, does the published order match what those inputs produce?
 */

export interface RankingInput {
  constitution: Constitution;
  projects: ProjectData[];
  /** When omitted, top votes are recounted from disclosures. */
  topVotes?: number;
  disclosures?: Disclosures;
}

export interface RankingSnapshot {
  /** Published placements keyed by track id. */
  rankings: Record<string, Placement[]>;
}

export function recomputeRankings(input: RankingInput): Record<string, Placement[]> {
  const topVotes =
    input.topVotes ??
    (input.disclosures === undefined ? 0 : tallyBallots(input.disclosures).topVotes);

  const tracks = new Set(input.constitution.tracks.map((track) => track.id));
  for (const project of input.projects) {
    tracks.add(project.track);
  }

  const rankings: Record<string, Placement[]> = {};
  for (const track of [...tracks].sort()) {
    rankings[track] = rankTrack(input.constitution, track, input.projects, topVotes);
  }

  return rankings;
}

export function checkRankings(input: RankingInput, published: RankingSnapshot): Check[] {
  const derived = recomputeRankings(input);
  const tracks = new Set([...Object.keys(derived), ...Object.keys(published.rankings)]);
  const checks: Check[] = [];

  for (const track of [...tracks].sort()) {
    checks.push(
      compareCheck(
        `ranking.${track}`,
        summarize(derived[track] ?? []),
        summarize(published.rankings[track] ?? []),
      ),
    );
  }

  return checks;
}

function summarize(placements: Placement[]): unknown {
  return placements.map((placement) => ({
    rank: placement.rank,
    team: placement.team,
    final_score: placement.final_score,
    judge_average: placement.judge_average,
    community: placement.community,
    decided_by: placement.decided_by,
  }));
}
