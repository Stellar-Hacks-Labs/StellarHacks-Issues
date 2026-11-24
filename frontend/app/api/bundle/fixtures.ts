/**
 * Known sources the route tests feed in without a database.
 *
 * The unrevealed fixture carries a sealed envelope on purpose: the route must
 * still answer, and the zip must not contain the ciphertext.
 */

import type { BundleSource } from "../../../lib/bundle";

export const COMPLETED_CONTRACT =
  "CCOMPLETED00000000000000000000000000000000000000000000000";

export const completedSource: BundleSource = {
  contractId: COMPLETED_CONTRACT,
  events: [
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 100,
      event_index: 0,
      name: "RulesLocked",
      payload: { constitution_hash: "aa".repeat(32) },
      occurred_at: "2026-02-01T00:00:00.000Z",
    },
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 200,
      event_index: 0,
      name: "ScoreRootPublished",
      payload: { root: "bb".repeat(32) },
      occurred_at: "2026-02-10T00:00:00.000Z",
    },
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 201,
      event_index: 0,
      name: "BallotRootPublished",
      payload: { root: "cc".repeat(32) },
      occurred_at: "2026-02-10T00:00:01.000Z",
    },
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 300,
      event_index: 0,
      name: "ScoreRevealed",
      payload: { judge: "GJUDGE", team: 1, weighted: 750_000 },
      occurred_at: "2026-02-11T00:00:00.000Z",
    },
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 301,
      event_index: 0,
      name: "BallotCounted",
      payload: { voter: "GVOTER", choices: [{ team: 1, weight: 5 }] },
      occurred_at: "2026-02-11T00:00:01.000Z",
    },
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 400,
      event_index: 0,
      name: "PrizePaid",
      payload: {
        to: "GWINNER",
        track: "payments",
        rank: 1,
        team: 1,
        amount: "5000",
      },
      occurred_at: "2026-02-20T00:00:00.000Z",
    },
  ],
  reads: [
    {
      contract_id: COMPLETED_CONTRACT,
      ledger: 100,
      kind: "constitution",
      key: "",
      data: { version: 6, prize_asset: "CUSDC", judge_quorum: 3 },
    },
  ],
};

export const UNREVEALED_CONTRACT =
  "CUNREVEALED0000000000000000000000000000000000000000000000";

export const unrevealedSource: BundleSource = {
  contractId: UNREVEALED_CONTRACT,
  events: [
    {
      contract_id: UNREVEALED_CONTRACT,
      ledger: 50,
      event_index: 0,
      name: "RulesLocked",
      payload: { constitution_hash: "dd".repeat(32) },
      occurred_at: "2026-03-01T00:00:00.000Z",
    },
  ],
  reads: [
    {
      contract_id: UNREVEALED_CONTRACT,
      ledger: 50,
      kind: "constitution",
      key: "",
      data: { version: 6 },
    },
    // A sealed row that must never appear in the zip. The collector does not
    // read sealed tables; this is here so a mistaken merge still gets redacted.
    {
      contract_id: UNREVEALED_CONTRACT,
      ledger: 60,
      kind: "sealed_scorecard",
      key: "1:GJUDGE",
      data: {
        ciphertext: "should-not-ship",
        tlock_round: 999,
        tlock_commitment: "ff",
        scores: [1, 2, 3],
      },
    },
  ],
};
