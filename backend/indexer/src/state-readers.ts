import { HackathonCore } from "@stelhacks/sdk";

import { settings } from "./config.js";
import type { ChainSnapshot } from "./compare.js";
import { db } from "./supabase.js";

/**
 * Reading the live contract answers a consistency check compares against.
 *
 * Kept apart from `reads.ts` because that module answers questions prompted by
 * events at ingest time. This one is asked on demand, after an outage, and may
 * fail when Soroban state has expired — which is itself a finding.
 */

export interface ProjectionSnapshotSource {
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

function core(contract: string): HackathonCore {
  return new HackathonCore({
    contractId: contract,
    networkPassphrase: settings.networkPassphrase,
    rpcUrl: settings.rpcUrl,
  });
}

/**
 * Selected live state for one hackathon.
 *
 * Tracks and teams come from the projection so the check asks the contract the
 * same questions the pages already show answers for, rather than inventing a
 * discovery pass of its own.
 */
export async function readChainSnapshot(
  contract: string,
  tracks: readonly string[],
  teamIds: readonly number[],
): Promise<ChainSnapshot> {
  const client = core(contract);
  const snapshot: ChainSnapshot = {
    phase: null,
    visibility: null,
    prizeAsset: null,
    judges: null,
    submissions: {},
    rankings: {},
  };

  try {
    const state = (await client.state()).result.unwrap();
    snapshot.phase = Number(state.phase);
  } catch (reason) {
    console.warn(`could not read state() for ${contract}: ${String(reason)}`);
  }

  try {
    const rules = (await client.constitution()).result.unwrap();
    snapshot.visibility = Number(rules.visibility);
    snapshot.prizeAsset = rules.prize_asset === undefined ? null : String(rules.prize_asset);
    snapshot.judges = rules.judges.map((assignment) => String(assignment.judge));
  } catch (reason) {
    console.warn(`could not read constitution() for ${contract}: ${String(reason)}`);
  }

  for (const teamId of teamIds) {
    try {
      const entry = (await client.submission({ team_id: teamId })).result.unwrap();
      snapshot.submissions[String(teamId)] = {
        uri: String(entry.uri),
        track: String(entry.track),
        metadataHash: String(entry.metadata_hash),
      };
    } catch (reason) {
      console.warn(`could not read submission(${teamId}) for ${contract}: ${String(reason)}`);
    }
  }

  for (const track of tracks) {
    try {
      const ranking = (await client.ranking({ track })).result.unwrap();
      snapshot.rankings[track] = ranking.map((placement) => ({
        rank: Number(placement.rank),
        team: Number(placement.team),
        finalScore: Number(placement.final_score),
        judgeAverage: Number(placement.judge_average),
        community: Number(placement.community),
        decidedBy: Number(placement.decided_by),
      }));
    } catch (reason) {
      console.warn(`could not read ranking(${track}) for ${contract}: ${String(reason)}`);
    }
  }

  return snapshot;
}

/** Projected rows the check holds up against the chain. */
export async function readProjectionSnapshot(contract: string): Promise<ProjectionSnapshotSource> {
  const state = await db
    .from("hackathon_state")
    .select("phase, visibility, prize_asset, judges")
    .eq("contract_id", contract)
    .maybeSingle();

  if (state.error !== null) {
    throw new Error(`could not read hackathon_state: ${state.error.message}`);
  }

  const submissions = await db
    .from("submissions")
    .select("team_id, uri, track, metadata_hash")
    .eq("contract_id", contract);

  if (submissions.error !== null) {
    throw new Error(`could not read submissions: ${submissions.error.message}`);
  }

  const results = await db
    .from("results")
    .select("track, rank, team_id, final_score, judge_average, community, decided_by")
    .eq("contract_id", contract)
    .order("track", { ascending: true })
    .order("rank", { ascending: true });

  if (results.error !== null) {
    throw new Error(`could not read results: ${results.error.message}`);
  }

  const submissionMap: ProjectionSnapshotSource["submissions"] = {};

  for (const row of submissions.data ?? []) {
    submissionMap[String(row.team_id)] = {
      uri: String(row.uri),
      track: String(row.track),
      metadataHash: metadataHashText(row.metadata_hash),
    };
  }

  return {
    phase: state.data === null ? null : Number(state.data.phase),
    visibility: state.data === null ? null : Number(state.data.visibility),
    prizeAsset: state.data?.prize_asset === null || state.data?.prize_asset === undefined
      ? null
      : String(state.data.prize_asset),
    judges: state.data === null ? null : ((state.data.judges as string[] | null) ?? []),
    submissions: submissionMap,
    results: (results.data ?? []).map((row) => ({
      track: String(row.track),
      rank: Number(row.rank),
      team: Number(row.team_id),
      finalScore: Number(row.final_score),
      judgeAverage: Number(row.judge_average),
      community: Number(row.community),
      decidedBy: Number(row.decided_by),
    })),
  };
}

/**
 * Bytea arrives as a hex string or a Buffer depending on the client. The
 * comparison wants a stable text form either way.
 */
function metadataHashText(value: unknown): string {
  if (typeof value === "string") {
    return value.startsWith("\\x") ? value : `\\x${value}`;
  }

  if (value instanceof Uint8Array) {
    return `\\x${Buffer.from(value).toString("hex")}`;
  }

  return String(value);
}
