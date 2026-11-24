import type { Contribution } from "../sponsor";
import type { PayoutRecord, PrizePlace, SponsorshipRecord } from "./trace";

/**
 * Inputs for this side's tests, written here rather than read from
 * `fixtures/sponsors/`.
 *
 * Deliberate duplication. The shared fixtures pin the rule between the contract
 * and the SDK; these pin that this application feeds the rule the right things.
 * A frontend test that read the shared file would pass while the application
 * handed the SDK rubbish, because the file would be doing the work.
 */

export const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
export const SPONSOR = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
export const OTHER_SPONSOR = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
export const WINNER = "GCWINNER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW";

const HASH_ONE = "aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111";
const HASH_TWO = "bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222bbbb2222";

/** The contract's list as `contributionsOf` returns it: newest first, unindexed. */
export function walletContributions(): Contribution[] {
  return [
    { index: 2, sponsor: OTHER_SPONSOR, track: "ai", rank: 1, amount: BigInt(250), fee: BigInt(12), at: 300 },
    { index: 1, sponsor: SPONSOR, track: "ai", rank: 2, amount: BigInt(500), fee: BigInt(25), at: 200 },
    { index: 0, sponsor: SPONSOR, track: "ai", rank: 1, amount: BigInt(1000), fee: BigInt(50), at: 100 },
  ];
}

export function records(): SponsorshipRecord[] {
  return [
    { index: 0, sponsor: SPONSOR, track: "ai", rank: 1, amount: BigInt(1000), fee: BigInt(50), at: 100 },
    { index: 1, sponsor: SPONSOR, track: "ai", rank: 2, amount: BigInt(500), fee: BigInt(25), at: 200 },
    { index: 2, sponsor: OTHER_SPONSOR, track: "ai", rank: 1, amount: BigInt(250), fee: BigInt(12), at: 300 },
  ];
}

export function places(): PrizePlace[] {
  return [
    { track: "ai", rank: 1, worth: BigInt(3000) },
    { track: "ai", rank: 2, worth: BigInt(1000) },
  ];
}

/** Payment rows exactly as PostgREST hands them over, `\x` prefix included. */
export function paymentRows(): Record<string, unknown>[] {
  return [
    { track: "ai", rank: 1, recipient: WINNER, amount: "3000", kind: 0, ledger: 5100, tx_hash: `\\x${HASH_ONE}` },
    { track: "ai", rank: 2, recipient: WINNER, amount: "1000", kind: 0, ledger: 5100, tx_hash: `\\x${HASH_TWO}` },
  ];
}

export function payouts(): PayoutRecord[] {
  return [
    { track: "ai", rank: 1, recipient: WINNER, amount: BigInt(3000), kind: 0, ledger: 5100, txHash: HASH_ONE },
    { track: "ai", rank: 2, recipient: WINNER, amount: BigInt(1000), kind: 0, ledger: 5100, txHash: HASH_TWO },
  ];
}

export const HASHES = { one: HASH_ONE, two: HASH_TWO };
