import { describe, expect, it } from "vitest";

import {
  PUBLIC_PASSPHRASE,
  TESTNET_PASSPHRASE,
  checkNetworkPassphrase,
  expectedPassphraseForRpc,
} from "../../src/doctor/network.js";

/**
 * Network passphrase checks catch the two mistakes that only show up at fee time.
 *
 * The property under defence is that a typo fails, and a known passphrase
 * pointed at the wrong RPC host fails with the network class — not rpc.
 */
describe("network passphrase validation", () => {
  it("accepts the testnet passphrase against the testnet RPC host", () => {
    const result = checkNetworkPassphrase(
      TESTNET_PASSPHRASE,
      "https://soroban-testnet.stellar.org",
    );

    expect(result.ok).toBe(true);
    expect(result.class).toBe("network");
  });

  it("rejects an unrecognised passphrase with the network class", () => {
    const result = checkNetworkPassphrase(
      "Wrong Network",
      "https://soroban-testnet.stellar.org",
    );

    expect(result.ok).toBe(false);
    expect(result.class).toBe("network");
    expect(result.message).toMatch(/unrecognised passphrase/);
  });

  it("rejects a public passphrase aimed at the testnet RPC host", () => {
    const result = checkNetworkPassphrase(
      PUBLIC_PASSPHRASE,
      "https://soroban-testnet.stellar.org",
    );

    expect(result.ok).toBe(false);
    expect(result.class).toBe("network");
    expect(result.message).toMatch(/does not match RPC host/);
  });

  it("maps known RPC hosts to the passphrase they serve", () => {
    expect(expectedPassphraseForRpc("https://soroban-testnet.stellar.org")).toBe(
      TESTNET_PASSPHRASE,
    );
    expect(expectedPassphraseForRpc("https://soroban-mainnet.stellar.org")).toBe(
      PUBLIC_PASSPHRASE,
    );
  });
});
