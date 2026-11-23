import { describe, expect, it } from "vitest";
import { assertTestKey, TESTNET_PASSPHRASE } from "./keys.mts";

const SHAPED = `S${"A".repeat(55)}`;

describe("end-to-end keys stay on testnet", () => {
  it("rejects the public network passphrase", () => {
    expect(() => assertTestKey(SHAPED, "Public Global Stellar Network ; September 2015")).toThrow(/testnet/);
  });

  it("rejects a secret that is not a Stellar secret", () => {
    expect(() => assertTestKey("not-a-key", TESTNET_PASSPHRASE)).toThrow(/test secret/);
  });

  it("accepts a shaped secret on the testnet passphrase", () => {
    expect(() => assertTestKey(SHAPED, TESTNET_PASSPHRASE)).not.toThrow();
  });
});
