/**
 * Comparing a projection slice with what the contract still answers.
 *
 * Pure on purpose. The consistency command gathers both sides and stores the
 * result; this module only says how they differ, so a divergent fixture can
 * prove the report without a network.
 */

export type ComparedTable = "hackathon_state" | "submissions" | "results";

export interface FieldMismatch {
  table: ComparedTable;
  /** Stable identity inside the table, e.g. `phase` or `team:1` or `payments:1`. */
  key: string;
  field: string;
  projected: unknown;
  onChain: unknown;
}

export interface ConsistencyReport {
  ok: boolean;
  mismatches: FieldMismatch[];
}

/** Selected contract answers the check cares about. */
export interface ChainSnapshot {
  phase: number | null;
  visibility: number | null;
  prizeAsset: string | null;
  judges: string[] | null;
  submissions: Record<string, { uri: string; track: string; metadataHash: string }>;
  rankings: Record<
    string,
    Array<{
      rank: number;
      team: number;
      finalScore: number;
      judgeAverage: number;
      community: number;
      decidedBy: number;
    }>
  >;
}

/** The projected rows those answers should match. */
export interface ProjectionSnapshot {
  phase: number | null;
  visibility: number | null;
  prizeAsset: string | null;
  judges: string[] | null;
  submissions: Record<string, { uri: string; track: string; metadataHash: string }>;
  results: Array<{
    track: string;
    rank: number;
    team: number;
    finalScore: number;
    judgeAverage: number;
    community: number;
    decidedBy: number;
  }>;
}

function mismatch(
  table: ComparedTable,
  key: string,
  field: string,
  projected: unknown,
  onChain: unknown,
): FieldMismatch {
  return { table, key, field, projected, onChain };
}

function sameScalar(a: unknown, b: unknown): boolean {
  return Object.is(a, b) || (a === null && b === null);
}

function sameStringList(a: string[] | null, b: string[] | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

/**
 * Every field that disagrees, named specifically so a report can be asserted
 * against a fixture rather than against a boolean.
 */
export function compare(projected: ProjectionSnapshot, onChain: ChainSnapshot): ConsistencyReport {
  const mismatches: FieldMismatch[] = [];

  if (!sameScalar(projected.phase, onChain.phase)) {
    mismatches.push(mismatch("hackathon_state", "state", "phase", projected.phase, onChain.phase));
  }

  if (!sameScalar(projected.visibility, onChain.visibility)) {
    mismatches.push(
      mismatch("hackathon_state", "state", "visibility", projected.visibility, onChain.visibility),
    );
  }

  if (!sameScalar(projected.prizeAsset, onChain.prizeAsset)) {
    mismatches.push(
      mismatch("hackathon_state", "state", "prize_asset", projected.prizeAsset, onChain.prizeAsset),
    );
  }

  if (!sameStringList(projected.judges, onChain.judges)) {
    mismatches.push(
      mismatch("hackathon_state", "state", "judges", projected.judges, onChain.judges),
    );
  }

  const teamIds = new Set([
    ...Object.keys(projected.submissions),
    ...Object.keys(onChain.submissions),
  ]);

  for (const teamId of [...teamIds].sort()) {
    const left = projected.submissions[teamId];
    const right = onChain.submissions[teamId];
    const key = `team:${teamId}`;

    if (left === undefined || right === undefined) {
      mismatches.push(mismatch("submissions", key, "present", left !== undefined, right !== undefined));
      continue;
    }

    if (!sameScalar(left.uri, right.uri)) {
      mismatches.push(mismatch("submissions", key, "uri", left.uri, right.uri));
    }

    if (!sameScalar(left.track, right.track)) {
      mismatches.push(mismatch("submissions", key, "track", left.track, right.track));
    }

    if (!sameScalar(left.metadataHash, right.metadataHash)) {
      mismatches.push(
        mismatch("submissions", key, "metadata_hash", left.metadataHash, right.metadataHash),
      );
    }
  }

  for (const [track, placements] of Object.entries(onChain.rankings)) {
    for (const placement of placements) {
      const row = projected.results.find((result) => result.track === track && result.rank === placement.rank);
      const key = `${track}:${placement.rank}`;

      if (row === undefined) {
        mismatches.push(mismatch("results", key, "present", false, true));
        continue;
      }

      if (!sameScalar(row.team, placement.team)) {
        mismatches.push(mismatch("results", key, "team_id", row.team, placement.team));
      }

      if (!sameScalar(row.finalScore, placement.finalScore)) {
        mismatches.push(mismatch("results", key, "final_score", row.finalScore, placement.finalScore));
      }

      if (!sameScalar(row.judgeAverage, placement.judgeAverage)) {
        mismatches.push(
          mismatch("results", key, "judge_average", row.judgeAverage, placement.judgeAverage),
        );
      }

      if (!sameScalar(row.community, placement.community)) {
        mismatches.push(mismatch("results", key, "community", row.community, placement.community));
      }

      if (!sameScalar(row.decidedBy, placement.decidedBy)) {
        mismatches.push(mismatch("results", key, "decided_by", row.decidedBy, placement.decidedBy));
      }
    }
  }

  for (const row of projected.results) {
    const placements = onChain.rankings[row.track] ?? [];
    if (!placements.some((placement) => placement.rank === row.rank)) {
      mismatches.push(mismatch("results", `${row.track}:${row.rank}`, "present", true, false));
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}
