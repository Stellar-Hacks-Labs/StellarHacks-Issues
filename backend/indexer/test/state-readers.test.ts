import { describe, expect, it } from "vitest";

import type { ProjectionSnapshotSource } from "../src/state-readers.js";

/**
 * Shape the projection snapshot must expose to the comparator.
 *
 * The live readers talk to Supabase and RPC; this suite pins the contract the
 * pure compare step depends on so a rename there fails here first.
 */
describe("projection snapshot shape used by consistency", () => {
  it("carries phase, submissions and results under stable keys", () => {
    const snapshot: ProjectionSnapshotSource = {
      phase: 4,
      visibility: 0,
      prizeAsset: null,
      judges: [],
      submissions: {
        "1": { uri: "ipfs://x", track: "payments", metadataHash: "\\x01" },
      },
      results: [
        {
          track: "payments",
          rank: 1,
          team: 1,
          finalScore: 1,
          judgeAverage: 1,
          community: 0,
          decidedBy: 0,
        },
      ],
    };

    expect(Object.keys(snapshot.submissions)).toEqual(["1"]);
    expect(snapshot.results[0]?.track).toBe("payments");
  });
});
