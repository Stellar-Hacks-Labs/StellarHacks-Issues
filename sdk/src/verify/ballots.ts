import type { Constitution } from "hackathon-core";

import { compareCheck, type Check } from "./compare.js";
import type { Disclosures } from "./disclosures.js";

/**
 * Recount community ballots from disclosures.
 *
 * The sealed tally is the weight per team. Recomputing it from every disclosed
 * ballot is what makes the community share of the ranking auditable without
 * trusting the page that shows the totals.
 */

export interface BallotTally {
  /** Weight per team id. */
  weights: Record<number, number>;
  /** Highest weight any team reached; drives communityScore. */
  topVotes: number;
}

export function tallyBallots(disclosures: Disclosures): BallotTally {
  const weights: Record<number, number> = {};

  for (const ballot of disclosures.ballots) {
    for (const choice of ballot.choices) {
      weights[choice.team] = (weights[choice.team] ?? 0) + choice.weight;
    }
  }

  const topVotes = Object.values(weights).reduce((max, weight) => Math.max(max, weight), 0);

  return { weights, topVotes };
}

/**
 * Compare a recount against the published per-team weights.
 *
 * `published` is keyed by team id the same way the contract's `vote_weight`
 * answers are. Teams with no votes may be omitted; both sides treat missing as
 * zero so a sparse map still compares cleanly.
 */
export function checkBallotTallies(
  disclosures: Disclosures,
  published: Record<number, number>,
  _constitution?: Constitution,
): Check[] {
  const derived = tallyBallots(disclosures);
  const teams = new Set([
    ...Object.keys(derived.weights).map(Number),
    ...Object.keys(published).map(Number),
  ]);

  const checks: Check[] = [];

  for (const team of [...teams].sort((a, b) => a - b)) {
    checks.push(
      compareCheck(
        `ballots.weight.${team}`,
        derived.weights[team] ?? 0,
        published[team] ?? 0,
      ),
    );
  }

  checks.push(compareCheck("ballots.topVotes", derived.topVotes, maxPublished(published)));

  return checks;
}

function maxPublished(published: Record<number, number>): number {
  return Object.values(published).reduce((max, weight) => Math.max(max, weight), 0);
}
