/**
 * Independent verifier: recompute a hackathon result from public data only.
 */

export { parseArgs, helpText, type VerifyArgs, type OutputFormat } from "./args.js";
export { run } from "./cli.js";
export {
  compareCheck,
  disagreements,
  allOk,
  type Check,
} from "./compare.js";
export {
  checkConstitution,
  normalizeHex,
  reviveConstitution,
  type ConstitutionSnapshot,
} from "./constitution.js";
export {
  parseDisclosures,
  disclosuresFromEvents,
  type Disclosures,
  type DisclosedBallot,
} from "./disclosures.js";
export {
  decodeVerifierEvents,
  parseEventFixture,
  type VerifierEvent,
} from "./events.js";
export {
  checkPayouts,
  recomputePayouts,
  splitEvenly,
  type ExpectedPayout,
  type PayoutSnapshot,
  type PublishedPayout,
  type TeamRoster,
} from "./payouts.js";
export {
  checkRankings,
  recomputeRankings,
  type RankingInput,
  type RankingSnapshot,
} from "./ranking.js";
export {
  buildReport,
  formatJson,
  formatText,
  type Report,
} from "./report.js";
export {
  checkRoots,
  recomputeRoots,
  type RootSnapshot,
  type RecomputedRoots,
} from "./roots.js";
export { loadHackathon, type LoadedHackathon, type LoadOptions } from "./rpc.js";
export {
  checkBallotTallies,
  tallyBallots,
  type BallotTally,
} from "./ballots.js";
export {
  firstRoundAtOrAfter,
  checkClaimedRound,
  QUICKNET_GENESIS_TIME,
  QUICKNET_PERIOD,
  type TlockCheck,
} from "./tlock.js";