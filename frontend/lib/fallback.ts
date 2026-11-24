import type { MissingJudgeFallback } from "./rules";

/** A short label for the rules and proof pages. */
export function labelOf(fallback: MissingJudgeFallback): string {
  switch (fallback.kind) {
    case "exclude":
      return "Exclude projects short of quorum";
    case "rank-available":
      return `Rank on at least ${fallback.floor} scorecards`;
    case "reassign":
      return `Allow up to ${fallback.allowance} missing judges`;
  }
}

/** One sentence explaining what the frozen policy does. */
export function explain(fallback: MissingJudgeFallback): string {
  switch (fallback.kind) {
    case "exclude":
      return "A project that finishes short of the announced quorum is left out of the ranking.";
    case "rank-available":
      return `A project with at least ${fallback.floor} scorecards is ranked on those averages, even when short of the quorum.`;
    case "reassign":
      return `A project may finish short by at most ${fallback.allowance} judges and still be ranked on the scorecards it received.`;
  }
}
