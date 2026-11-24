import { describe, expect, it } from "vitest";

import { checkRpc } from "../../src/doctor/rpc.js";

/**
 * RPC probes fail with the rpc class and never submit a transaction.
 *
 * The property under defence is that a refused connection becomes a typed
 * failure, and that a healthy getHealth result passes with the ledger number.
 */
describe("rpc reachability", () => {
  it("fails the rpc class when the endpoint refuses the connection", async () => {
    const result = await checkRpc("https://127.0.0.1:1", async () => ({
      ok: false,
      reason: "connect ECONNREFUSED",
    }));

    expect(result.ok).toBe(false);
    expect(result.class).toBe("rpc");
    expect(result.message).toMatch(/unreachable/);
  });

  it("passes when getHealth returns a ledger", async () => {
    const result = await checkRpc("https://example.test/rpc", async () => ({
      ok: true,
      health: { latestLedger: 1_234_567 },
    }));

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/1234567/);
  });
});
