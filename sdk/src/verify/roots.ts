import { ballotLeaf, scorecardLeaf } from "../hashing.js";
import { toHex } from "../hex.js";
import * as merkle from "../merkle.js";
import { compareCheck, type Check } from "./compare.js";
import { normalizeHex } from "./constitution.js";
import type { Disclosures } from "./disclosures.js";

/**
 * Rebuild sealed Merkle roots from disclosed leaves and compare to the chain.
 *
 * The collection service (or a Strict-mode judge) published one digest for
 * every scorecard and one for every ballot. Rebuilding those digests from the
 * disclosed leaves is what proves nothing was dropped or invented at seal time.
 */

export interface RootSnapshot {
  scoreRoot?: string;
  ballotRoot?: string;
}

export interface RecomputedRoots {
  scoreRoot: string | null;
  ballotRoot: string | null;
}

export function recomputeRoots(disclosures: Disclosures): RecomputedRoots {
  const scoreLeaves = disclosures.scorecards.map((card) => scorecardLeaf(card));
  const ballotLeaves = disclosures.ballots.map((ballot) =>
    ballotLeaf(ballot.voter, ballot.choices),
  );

  return {
    scoreRoot: scoreLeaves.length === 0 ? null : toHex(merkle.build(scoreLeaves).root),
    ballotRoot: ballotLeaves.length === 0 ? null : toHex(merkle.build(ballotLeaves).root),
  };
}

export function checkRoots(disclosures: Disclosures, published: RootSnapshot): Check[] {
  const derived = recomputeRoots(disclosures);
  const checks: Check[] = [];

  if (published.scoreRoot !== undefined) {
    checks.push(
      compareCheck(
        "roots.score",
        derived.scoreRoot,
        derived.scoreRoot === null ? null : normalizeHex(published.scoreRoot),
      ),
    );
  }

  if (published.ballotRoot !== undefined) {
    checks.push(
      compareCheck(
        "roots.ballot",
        derived.ballotRoot,
        derived.ballotRoot === null ? null : normalizeHex(published.ballotRoot),
      ),
    );
  }

  return checks;
}
