/**
 * Surplus routes for undirected vault balance beyond the prize table.
 *
 * Every deposit in the vault beyond what is owed to the prize table and platform fee
 * has a declared destination frozen in the constitution.
 */

export type SurplusRoute =
  | { tag: "ProRata" }
  | { tag: "Return"; values: [string] }
  | { tag: "Roll"; values: [string] };

export interface PositionTier {
  track: string;
  rank: number;
  amount: bigint;
}

export interface SurplusShare {
  track: string;
  rank: number;
  amount: bigint;
}

/**
 * Calculates the pro rata allocation of a surplus across prize tiers.
 * Any remainder due to integer division is assigned to the top place.
 */
export function divideSurplusProRata(
  surplus: bigint,
  tiers: readonly PositionTier[]
): SurplusShare[] {
  if (tiers.length === 0 || surplus <= 0n) {
    return tiers.map((tier) => ({ track: tier.track, rank: tier.rank, amount: 0n }));
  }

  const totalPrize = tiers.reduce((sum, t) => sum + t.amount, 0n);
  if (totalPrize <= 0n) {
    return tiers.map((tier) => ({ track: tier.track, rank: tier.rank, amount: 0n }));
  }

  let allocated = 0n;
  const shares: bigint[] = tiers.map((tier) => {
    const share = (surplus * tier.amount) / totalPrize;
    allocated += share;
    return share;
  });

  let topIdx = 0;
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i]!.rank < tiers[topIdx]!.rank) {
      topIdx = i;
    }
  }

  shares[topIdx] = shares[topIdx]! + (surplus - allocated);

  return tiers.map((tier, idx) => ({
    track: tier.track,
    rank: tier.rank,
    amount: shares[idx]!,
  }));
}

export function formatSurplusRoute(route: SurplusRoute | null | undefined): string {
  if (!route) {
    return "Pro-rata top-up (default)";
  }
  switch (route.tag) {
    case "ProRata":
      return "Pro-rata top-up across prize tiers";
    case "Return":
      return `Return to ${route.values[0]}`;
    case "Roll":
      return `Roll forward to next vault (${route.values[0]})`;
    default:
      return "Pro-rata top-up across prize tiers";
  }
}
