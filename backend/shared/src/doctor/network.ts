import { fail, pass, type CheckResult } from "./report.js";

/** Well-known Stellar network passphrases. */
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";

const KNOWN = new Set([TESTNET_PASSPHRASE, PUBLIC_PASSPHRASE]);

/**
 * Heuristic: which passphrase an RPC URL is expected to serve.
 *
 * The doctor refuses to invent a mapping for unknown hosts; those only get the
 * known-passphrase check. Known public hosts are matched so a testnet key
 * pointed at mainnet (or the reverse) fails before a fee is spent.
 */
export function expectedPassphraseForRpc(rpcUrl: string): string | null {
  let host: string;
  try {
    host = new URL(rpcUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (host.includes("testnet") || host.includes("futurenet")) {
    return TESTNET_PASSPHRASE;
  }
  if (
    host === "soroban-mainnet.stellar.org" ||
    host === "mainnet.stellar.org" ||
    host.includes("mainnet")
  ) {
    return PUBLIC_PASSPHRASE;
  }
  return null;
}

/**
 * Validates the configured passphrase.
 *
 * Two failure modes: an unknown string (typo, truncated copy-paste), and a
 * known passphrase that does not match the RPC host the process will talk to.
 */
export function checkNetworkPassphrase(
  passphrase: string,
  rpcUrl: string,
): CheckResult {
  if (!KNOWN.has(passphrase)) {
    return fail(
      "network",
      "STELLAR_NETWORK_PASSPHRASE",
      `unrecognised passphrase ${JSON.stringify(passphrase)}. Expected ${JSON.stringify(TESTNET_PASSPHRASE)} or ${JSON.stringify(PUBLIC_PASSPHRASE)}.`,
    );
  }

  const expected = expectedPassphraseForRpc(rpcUrl);
  if (expected !== null && passphrase !== expected) {
    return fail(
      "network",
      "STELLAR_NETWORK_PASSPHRASE",
      `passphrase does not match RPC host (got ${JSON.stringify(passphrase)}, expected ${JSON.stringify(expected)} for ${rpcUrl}).`,
    );
  }

  return pass(
    "network",
    "STELLAR_NETWORK_PASSPHRASE",
    passphrase === TESTNET_PASSPHRASE ? "testnet" : "public",
  );
}
