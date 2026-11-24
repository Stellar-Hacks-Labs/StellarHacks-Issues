/**
 * The missing-judge fallback, mirrored from the contract.
 *
 * Freezing one of these with the rules is what turns a silent exclusion into a
 * policy a participant can read. The shapes match `MissingJudgeFallback` in
 * Rust byte for byte so hashing and ranking stay aligned.
 */

export type MissingJudgeFallback =
  | { tag: "Exclude"; values: undefined }
  | { tag: "RankAvailable"; values: readonly [number] }
  | { tag: "Reassign"; values: readonly [number] };

/** How many scorecards a project needs under this policy. */
export function scoresRequired(fallback: MissingJudgeFallback, judgeQuorum: number): number {
  switch (fallback.tag) {
    case "Exclude":
      return judgeQuorum;
    case "RankAvailable":
      return fallback.values[0];
    case "Reassign": {
      const needed = judgeQuorum - fallback.values[0];
      return needed <= 0 ? 1 : needed;
    }
  }
}

/** Whether revealed scorecards are enough to enter the ranking. */
export function admitsToRanking(
  scoreCount: number,
  judgeQuorum: number,
  fallback: MissingJudgeFallback,
  quorumBinds: boolean,
): boolean {
  if (!quorumBinds) {
    return true;
  }

  return scoreCount >= scoresRequired(fallback, judgeQuorum);
}

/** Whether a ranked project used the fallback rather than meeting the quorum. */
export function rankedUnderFallback(
  scoreCount: number,
  judgeQuorum: number,
  quorumBinds: boolean,
): boolean {
  return quorumBinds && scoreCount < judgeQuorum;
}

/** A short label for rules pages and the create wizard. */
export function labelFallback(fallback: MissingJudgeFallback): string {
  switch (fallback.tag) {
    case "Exclude":
      return "Exclude projects short of quorum";
    case "RankAvailable":
      return `Rank on at least ${fallback.values[0]} scorecards`;
    case "Reassign":
      return `Allow up to ${fallback.values[0]} missing judges`;
  }
}
