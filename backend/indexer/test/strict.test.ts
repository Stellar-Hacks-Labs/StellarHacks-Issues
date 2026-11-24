import { describe, expect, it } from "vitest";

import { project } from "../src/project.js";
import type { ProjectedEvent } from "../src/records.js";

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const ORGANIZER = "GB45FLZ24LKDNR2OSMHGI45PA47PY4W4VSTK7BPTATZTPN7JVEG3Y4WP";
const JUDGE = "GCZYAVTGEEWBFJNBFNPWOYNFPBA4C5O7YFYVZXUHWLKXZCV4LCAJH2QC";

let ledger = 200;

function at(name: string, payload: Record<string, unknown>): ProjectedEvent {
  ledger += 1;

  return {
    contract_id: CONTRACT,
    ledger,
    event_index: 0,
    name,
    fields: payload,
    tx_hash: "\\xfeed",
    occurred_at: new Date(Date.UTC(2026, 10, 21, 0, 0, ledger)).toISOString(),
  };
}

describe("strict-mode commitment projection", () => {
  it("keeps a commitment that was never disclosed", () => {
    ledger = 200;
    const events = [
      at("Created", { organizer: ORGANIZER }),
      at("ScorecardCommitted", {
        judge: JUDGE,
        team: 1,
        commitment: "\\xabcd",
      }),
    ];

    const rows = project(events, []);
    expect(rows.scorecard_commitments).toEqual([
      {
        contract_id: CONTRACT,
        team_id: 1,
        judge: JUDGE,
        commitment: "\\xabcd",
        committed_at_ledger: 202,
        disclosed_at_ledger: null,
      },
    ]);
    expect(rows.scores).toEqual([]);
  });

  it("stamps a disclose onto the commitment and writes the score", () => {
    ledger = 200;
    const events = [
      at("Created", { organizer: ORGANIZER }),
      at("ScorecardCommitted", {
        judge: JUDGE,
        team: 1,
        commitment: "\\xabcd",
      }),
      at("ScoreRevealed", { judge: JUDGE, team: 1, weighted: 720000 }),
    ];

    const rows = project(events, []);
    expect(rows.scorecard_commitments[0]!.disclosed_at_ledger).toBe(203);
    expect(rows.scores).toEqual([
      {
        contract_id: CONTRACT,
        team_id: 1,
        judge: JUDGE,
        weighted: 720000,
        revealed_at_ledger: 203,
      },
    ]);
  });
});
