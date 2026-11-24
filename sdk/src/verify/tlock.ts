/**
 * Drand quicknet round derivation from a locked judging deadline.
 *
 * The sealer and the browser both pick the first round at or after the
 * deadline frozen on chain. Reproducing that choice from public constants
 * alone is what lets a participant check the claimed reveal round without
 * asking the sealer API or Drand itself.
 *
 * Quicknet parameters are public network facts, not secrets; hardcoding them
 * keeps the verifier off every network that is not Stellar RPC.
 */

/** Drand quicknet genesis time, seconds since Unix epoch. */
export const QUICKNET_GENESIS_TIME = 1_692_803_367;

/** Drand quicknet beacon period in seconds. */
export const QUICKNET_PERIOD = 3;

export interface TlockCheck {
  judgingClosesAt: number;
  expectedRound: number;
  claimedRound: number;
  ok: boolean;
}

/**
 * The first quicknet round whose beacon time is at or after `revealAt` seconds.
 *
 * Matches the calculation the reference sealer and the browser seal helper use,
 * so a claimed round that came from either agrees with this function.
 */
export function firstRoundAtOrAfter(
  revealAtSeconds: number,
  genesisTime: number = QUICKNET_GENESIS_TIME,
  period: number = QUICKNET_PERIOD,
): number {
  if (!Number.isFinite(revealAtSeconds) || revealAtSeconds < 0) {
    throw new Error("revealAt must be a non-negative number of seconds");
  }

  if (period <= 0) {
    throw new Error("drand period must be positive");
  }

  const targetMs = revealAtSeconds * 1000;
  const genesisMs = genesisTime * 1000;
  const periodMs = period * 1000;
  const atTarget = Math.floor((targetMs - genesisMs) / periodMs) + 1;
  const atTargetMs = genesisMs + (atTarget - 1) * periodMs;

  return atTargetMs < targetMs ? atTarget + 1 : atTarget;
}

/**
 * Whether a claimed reveal round is the one the locked deadline implies.
 */
export function checkClaimedRound(
  judgingClosesAt: number,
  claimedRound: number,
  genesisTime: number = QUICKNET_GENESIS_TIME,
  period: number = QUICKNET_PERIOD,
): TlockCheck {
  const expectedRound = firstRoundAtOrAfter(judgingClosesAt, genesisTime, period);

  return {
    judgingClosesAt,
    expectedRound,
    claimedRound,
    ok: expectedRound === claimedRound,
  };
}
