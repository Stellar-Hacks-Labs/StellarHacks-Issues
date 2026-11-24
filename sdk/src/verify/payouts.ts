import type { Constitution, Placement } from "hackathon-core";

import { compareCheck, type Check } from "./compare.js";

/**
 * Recompute what each prize position is worth and how it splits across a team.
 *
 * The constitution's prize table is the base; sponsorship bonuses add on top.
 * Member shares follow the contract's even split with remainder to the earliest
 * members, so a page that rounds differently is caught here.
 */

export interface TeamRoster {
  id: number;
  members: string[];
}

export interface PublishedPayout {
  track: string;
  rank: number;
  /** Total for the position, smallest asset units. */
  amount: string | number | bigint;
  team?: number;
  members?: string[];
  /** Per-member shares in roster order, when known. */
  shares?: Array<string | number | bigint>;
}

export interface PayoutSnapshot {
  /** Bonus amounts keyed as `track:rank`. */
  bonuses?: Record<string, string | number | bigint>;
  payouts: PublishedPayout[];
  teams?: TeamRoster[];
}

export interface ExpectedPayout {
  track: string;
  rank: number;
  amount: bigint;
  team: number | null;
  members: string[];
  shares: bigint[];
}

export function recomputePayouts(
  constitution: Constitution,
  rankings: Record<string, Placement[]>,
  snapshot: PayoutSnapshot,
): ExpectedPayout[] {
  const teams = new Map((snapshot.teams ?? []).map((team) => [team.id, team]));
  const expected: ExpectedPayout[] = [];

  for (const tier of constitution.prize_tiers) {
    const bonus = asBigInt(snapshot.bonuses?.[`${tier.track}:${tier.rank}`] ?? 0n);
    const amount = BigInt(tier.amount) + bonus;
    const placement = (rankings[tier.track] ?? []).find((row) => row.rank === tier.rank);
    const teamId = placement?.team ?? null;
    const roster = teamId === null ? undefined : teams.get(teamId);
    const members = roster?.members ?? [];
    const shares = members.length === 0 ? [] : splitEvenly(amount, members.length);

    expected.push({
      track: tier.track,
      rank: tier.rank,
      amount,
      team: teamId,
      members,
      shares,
    });
  }

  return expected;
}

export function checkPayouts(
  constitution: Constitution,
  rankings: Record<string, Placement[]>,
  snapshot: PayoutSnapshot,
): Check[] {
  const derived = recomputePayouts(constitution, rankings, snapshot);
  const byKey = new Map(
    snapshot.payouts.map((payout) => [`${payout.track}:${payout.rank}`, payout]),
  );
  const checks: Check[] = [];

  for (const expected of derived) {
    const key = `${expected.track}:${expected.rank}`;
    const published = byKey.get(key);

    checks.push(
      compareCheck(
        `payouts.${key}.amount`,
        expected.amount.toString(),
        published === undefined ? null : asBigInt(published.amount).toString(),
      ),
    );

    if (published?.shares !== undefined) {
      checks.push(
        compareCheck(
          `payouts.${key}.shares`,
          expected.shares.map((share) => share.toString()),
          published.shares.map((share) => asBigInt(share).toString()),
        ),
      );
    }

    if (published?.team !== undefined) {
      checks.push(compareCheck(`payouts.${key}.team`, expected.team, published.team));
    }
  }

  return checks;
}

/**
 * Even split with remainder to the earliest members, matching `Team::share_of`.
 */
export function splitEvenly(total: bigint, size: number): bigint[] {
  if (size <= 0) {
    throw new Error("a team needs at least one member to split a prize");
  }

  const base = total / BigInt(size);
  const remainder = total % BigInt(size);
  const shares: bigint[] = [];

  for (let index = 0; index < size; index += 1) {
    shares.push(base + (BigInt(index) < remainder ? 1n : 0n));
  }

  return shares;
}

function asBigInt(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}
