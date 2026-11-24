import { describe, expect, it } from "vitest";

import { collectBundle } from "./collect";
import { sha256Hex } from "./manifest";
import { exportBundle } from "./index";

const CONTRACT = "CTESTCONTRACT0000000000000000000000000000000000000000000";

function source() {
  return {
    contractId: CONTRACT,
    events: [
      {
        contract_id: CONTRACT,
        ledger: 10,
        event_index: 0,
        name: "RulesLocked",
        payload: { constitution_hash: "abcd" },
        occurred_at: "2026-01-01T00:00:00Z",
      },
      {
        contract_id: CONTRACT,
        ledger: 20,
        event_index: 0,
        name: "ScoreRootPublished",
        payload: { root: "11".repeat(32) },
        occurred_at: "2026-01-02T00:00:00Z",
      },
      {
        contract_id: CONTRACT,
        ledger: 21,
        event_index: 0,
        name: "BallotRootPublished",
        payload: { root: "22".repeat(32) },
        occurred_at: "2026-01-02T00:01:00Z",
      },
      {
        contract_id: CONTRACT,
        ledger: 30,
        event_index: 0,
        name: "ScoreRevealed",
        payload: { judge: "GJUDGE", team: 1, weighted: 800_000 },
        occurred_at: "2026-01-03T00:00:00Z",
      },
      {
        contract_id: CONTRACT,
        ledger: 40,
        event_index: 0,
        name: "PrizePaid",
        payload: { to: "GWIN", track: "payments", rank: 1, team: 1, amount: "5000" },
        occurred_at: "2026-01-04T00:00:00Z",
      },
    ],
    reads: [
      {
        contract_id: CONTRACT,
        ledger: 10,
        kind: "constitution",
        key: "",
        data: { version: 6, prize_asset: "CUSDC" },
      },
    ],
  };
}

describe("collectBundle", () => {
  it("splits roots, disclosures and payouts out of the event stream", () => {
    const files = collectBundle(source());
    const roots = JSON.parse(Buffer.from(files.get("roots.json")!).toString("utf8"));
    expect(roots.score_root).toBe("11".repeat(32));
    expect(roots.ballot_root).toBe("22".repeat(32));

    const disclosures = Buffer.from(files.get("disclosures.jsonl")!).toString("utf8");
    expect(disclosures).toContain("ScoreRevealed");

    const payouts = Buffer.from(files.get("payouts.jsonl")!).toString("utf8");
    expect(payouts).toContain("PrizePaid");
  });

  it("two exports of the same completed hackathon are byte-identical", () => {
    const first = exportBundle(source());
    const second = exportBundle(source());
    expect(sha256Hex(first)).toBe(sha256Hex(second));
    expect(Buffer.from(first).equals(Buffer.from(second))).toBe(true);
  });
});
