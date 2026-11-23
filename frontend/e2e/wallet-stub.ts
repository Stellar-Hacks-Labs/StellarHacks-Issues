import { assertTestKey, TESTNET_PASSPHRASE } from "../scripts/lib/keys.mts";

/**
 * Signs with a test key and nothing else.
 *
 * The browser stub calls this before it returns a signature. A mainnet
 * passphrase throws, so a misconfigured run cannot sign a funded account.
 */
export function signWithTestKey(secret: string, passphrase: string = TESTNET_PASSPHRASE): { publicHint: string } {
  assertTestKey(secret, passphrase);
  return { publicHint: "test-key" };
}
