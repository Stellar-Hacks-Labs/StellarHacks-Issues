import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import { checkFunding } from "../../src/doctor/funding.js";
import { TESTNET_PASSPHRASE } from "../../src/doctor/network.js";

/**
 * Funding checks observe Horizon and never sign.
 *
 * The property under defence is that a missing account fails with the funding
 * class, a low balance fails the same way, and an invalid secret is named
 * without attempting a network write.
 */
describe("service account funding", () => {
  it("fails the funding class for an invalid secret", async () => {
    const result = await checkFunding({
      secret: "not-a-secret",
      name: "CLOCK_SECRET_KEY",
      passphrase: TESTNET_PASSPHRASE,
      loadAccount: async () => {
        throw new Error("should not be called");
      },
    });

    expect(result.ok).toBe(false);
    expect(result.class).toBe("funding");
    expect(result.message).toMatch(/invalid/);
  });

  it("fails the funding class when Horizon has no such account", async () => {
    const key = Keypair.random();
    const result = await checkFunding({
      secret: key.secret(),
      name: "CLOCK_SECRET_KEY",
      passphrase: TESTNET_PASSPHRASE,
      loadAccount: async () => ({
        ok: false,
        reason: "Not Found",
        missing: true,
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.class).toBe("funding");
    expect(result.message).toMatch(/not on the network/);
    expect(result.message).toContain(key.publicKey());
  });

  it("fails when the native balance is below the minimum", async () => {
    const key = Keypair.random();
    const result = await checkFunding({
      secret: key.secret(),
      name: "SEALER_SECRET_KEY",
      passphrase: TESTNET_PASSPHRASE,
      minimumXlm: 5,
      loadAccount: async () => ({ ok: true, balance: 0.5 }),
    });

    expect(result.ok).toBe(false);
    expect(result.class).toBe("funding");
    expect(result.message).toMatch(/need at least 5/);
  });

  it("passes when the account holds enough lumens", async () => {
    const key = Keypair.random();
    const result = await checkFunding({
      secret: key.secret(),
      name: "CLOCK_SECRET_KEY",
      passphrase: TESTNET_PASSPHRASE,
      loadAccount: async () => ({ ok: true, balance: 100 }),
    });

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/funded/);
  });
});
