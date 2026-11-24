import { readFileSync } from "node:fs";

import { Client as HackathonCore, type Constitution, type Placement } from "hackathon-core";

import { toHex } from "../hex.js";
import type { ProjectData } from "../results.js";
import { normalizeHex, reviveConstitution } from "./constitution.js";
import { parseDisclosures, type Disclosures } from "./disclosures.js";
import { parseEventFixture, type VerifierEvent } from "./events.js";
import type { PayoutSnapshot } from "./payouts.js";
import type { RootSnapshot } from "./roots.js";
/**
 * Load everything the verifier needs, either from Soroban RPC or from fixtures.
 *
 * The offline path exists so the suite can prove disagreement without a
 * network, and so a reader can replay a published snapshot later. Live mode
 * talks only to the configured RPC URL — never to Supabase, the sealer, or the
 * web application.
 */

export interface LoadedHackathon {
  contractId: string;
  constitution: Constitution;
  publishedHash: string;
  roots: RootSnapshot;
  disclosures: Disclosures;
  projects: ProjectData[];
  topVotes: number;
  voteWeights: Record<number, number>;
  rankings: Record<string, Placement[]>;
  payouts: PayoutSnapshot;
  events: VerifierEvent[];
  tlock?: { judgingClosesAt: number; claimedRound: number };
  /** True when data came from fixtures rather than RPC. */
  offline: boolean;
}

export interface LoadOptions {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
  statePath?: string;
  eventsPath?: string;
}

export async function loadHackathon(options: LoadOptions): Promise<LoadedHackathon> {
  if (options.statePath !== undefined) {
    return loadFromFixtures(options.statePath, options.eventsPath, options.contractId);
  }

  return loadFromRpc(options);
}

function loadFromFixtures(
  statePath: string,
  eventsPath: string | undefined,
  fallbackContractId: string,
): LoadedHackathon {
  const state = JSON.parse(readFileSync(statePath, "utf8")) as Record<string, unknown>;
  const events =
    eventsPath === undefined
      ? Array.isArray(state["events"])
        ? parseEventFixture(state["events"])
        : []
      : parseEventFixture(JSON.parse(readFileSync(eventsPath, "utf8")));

  const disclosures = parseDisclosures(state["disclosures"] ?? state);
  const projects = readProjects(state["projects"]);
  const rankings = readRankings(state["rankings"]);
  const voteWeights = readNumberMap(state["voteWeights"]);
  const topVotes =
    typeof state["topVotes"] === "number"
      ? state["topVotes"]
      : Object.values(voteWeights).reduce((max, weight) => Math.max(max, weight), 0);

  const tlockRaw = state["tlock"];
  const tlock =
    tlockRaw !== null && typeof tlockRaw === "object"
      ? {
          judgingClosesAt: Number((tlockRaw as Record<string, unknown>)["judgingClosesAt"]),
          claimedRound: Number((tlockRaw as Record<string, unknown>)["claimedRound"]),
        }
      : undefined;

  return {
    contractId:
      typeof state["contractId"] === "string" ? state["contractId"] : fallbackContractId,
    constitution: reviveConstitution(state["constitution"]),
    publishedHash: normalizeHex(String(state["constitutionHash"] ?? "")),
    roots: {
      scoreRoot:
        state["scoreRoot"] === undefined || state["scoreRoot"] === null
          ? undefined
          : String(state["scoreRoot"]),
      ballotRoot:
        state["ballotRoot"] === undefined || state["ballotRoot"] === null
          ? undefined
          : String(state["ballotRoot"]),
    },
    disclosures,
    projects,
    topVotes,
    voteWeights,
    rankings,
    payouts: readPayouts(state["payouts"]),
    events,
    tlock,
    offline: true,
  };
}

async function loadFromRpc(options: LoadOptions): Promise<LoadedHackathon> {
  const core = new HackathonCore({
    contractId: options.contractId,
    networkPassphrase: options.networkPassphrase,
    rpcUrl: options.rpcUrl,
  });

  const constitution = (await core.constitution()).result.unwrap();
  const published = (await core.constitution_hash()).result.unwrap();

  let scoreRoot: string | undefined;
  let ballotRoot: string | undefined;

  try {
    scoreRoot = toHex(new Uint8Array((await core.score_root()).result.unwrap()));
  } catch {
    scoreRoot = undefined;
  }

  try {
    ballotRoot = toHex(new Uint8Array((await core.ballot_root()).result.unwrap()));
  } catch {
    ballotRoot = undefined;
  }

  const teams = (await core.team_count()).result;
  const topVotes = (await core.top_vote_weight()).result;
  const projects: ProjectData[] = [];
  const voteWeights: Record<number, number> = {};
  const teamRosters: { id: number; members: string[] }[] = [];

  for (let team = 1; team <= teams; team += 1) {
    const submission = (await core.submission({ team_id: team })).result;
    if (submission.isErr()) {
      continue;
    }

    const entry = submission.unwrap();
    const scores = (await core.score_tally({ team_id: team })).result;
    const votes = (await core.vote_weight({ team_id: team })).result;
    voteWeights[team] = votes;

    const criterionTallies: ProjectData["criterionTallies"] = {};
    for (const rule of constitution.tie_break) {
      if (rule.tag === "Criterion") {
        const tally = (
          await core.criterion_tally({ team_id: team, criterion: rule.values[0] })
        ).result;
        criterionTallies[rule.values[0]] = { count: tally.count, total: BigInt(tally.total) };
      }
    }

    projects.push({
      team,
      track: entry.track,
      submittedAt: BigInt(entry.submitted_at),
      valid: entry.status === 0,
      scores: { count: scores.count, total: BigInt(scores.total) },
      votes,
      criterionTallies,
    });

    const roster = (await core.team_by_id({ id: team })).result;
    if (roster.isOk()) {
      const teamRow = roster.unwrap();
      teamRosters.push({ id: teamRow.id, members: teamRow.members });
    }
  }

  const rankings: Record<string, Placement[]> = {};
  const payoutRows: PayoutSnapshot["payouts"] = [];
  const bonuses: Record<string, string> = {};

  for (const track of constitution.tracks) {
    try {
      rankings[track.id] = (await core.ranking({ track: track.id })).result.unwrap();
    } catch {
      rankings[track.id] = [];
    }
  }

  for (const tier of constitution.prize_tiers) {
    let amount = BigInt(tier.amount);
    try {
      amount = BigInt((await core.payable({ track: tier.track, rank: tier.rank })).result.unwrap());
      const bonus = amount - BigInt(tier.amount);
      if (bonus !== 0n) {
        bonuses[`${tier.track}:${tier.rank}`] = bonus.toString();
      }
    } catch {
      // Position may not be payable yet; fall back to the frozen table.
    }

    const placement = (rankings[tier.track] ?? []).find((row) => row.rank === tier.rank);
    payoutRows.push({
      track: tier.track,
      rank: tier.rank,
      amount: amount.toString(),
      team: placement?.team,
    });
  }

  // Live mode has no sealer API: disclosures come only when a caller also
  // supplies a fixture, or when later work streams reveal transactions. The
  // ranking and payout checks still run from tallies the contract already
  // published.
  const disclosures: Disclosures = { scorecards: [], ballots: [] };

  return {
    contractId: options.contractId,
    constitution,
    publishedHash: toHex(new Uint8Array(published)),
    roots: { scoreRoot, ballotRoot },
    disclosures,
    projects,
    topVotes,
    voteWeights,
    rankings,
    payouts: { bonuses, payouts: payoutRows, teams: teamRosters },
    events: [],
    tlock: {
      judgingClosesAt: Number(constitution.schedule.judging_closes_at),
      claimedRound: 0,
    },
    offline: false,
  };
}

function readProjects(raw: unknown): ProjectData[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry) => {
    const body = entry as Record<string, unknown>;
    const scores = body["scores"] as Record<string, unknown>;
    const criterionTallies: ProjectData["criterionTallies"] = {};
    const rawTallies = (body["criterionTallies"] ?? {}) as Record<string, Record<string, unknown>>;

    for (const [id, tally] of Object.entries(rawTallies)) {
      criterionTallies[id] = {
        count: Number(tally["count"]),
        total: BigInt(String(tally["total"])),
      };
    }

    return {
      team: Number(body["team"]),
      track: String(body["track"]),
      submittedAt: BigInt(String(body["submittedAt"])),
      valid: Boolean(body["valid"]),
      scores: {
        count: Number(scores["count"]),
        total: BigInt(String(scores["total"])),
      },
      votes: Number(body["votes"]),
      criterionTallies,
    };
  });
}

function readRankings(raw: unknown): Record<string, Placement[]> {
  if (raw === null || typeof raw !== "object") {
    return {};
  }

  const rankings: Record<string, Placement[]> = {};
  for (const [track, rows] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(rows)) {
      continue;
    }
    rankings[track] = rows as Placement[];
  }

  return rankings;
}

function readNumberMap(raw: unknown): Record<number, number> {
  if (raw === null || typeof raw !== "object") {
    return {};
  }

  const map: Record<number, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    map[Number(key)] = Number(value);
  }

  return map;
}

function readPayouts(raw: unknown): PayoutSnapshot {
  if (raw === null || typeof raw !== "object") {
    return { payouts: [] };
  }

  const body = raw as Record<string, unknown>;

  return {
    bonuses: (body["bonuses"] as Record<string, string | number | bigint> | undefined) ?? {},
    payouts: Array.isArray(body["payouts"]) ? (body["payouts"] as PayoutSnapshot["payouts"]) : [],
    teams: Array.isArray(body["teams"]) ? (body["teams"] as PayoutSnapshot["teams"]) : [],
  };
}
