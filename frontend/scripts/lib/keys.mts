/**
 * The only keys an end-to-end test is allowed to sign with.
 *
 * The passphrase has to be the public testnet. A secret that is not a
 * Stellar secret shape is refused before it reaches a signer. These checks
 * do not prove a key is unfunded. They do refuse a mainnet passphrase, which
 * is the mistake that would spend somebody's lumens.
 */
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

export function assertTestKey(secret: string, passphrase: string): void {
  if (passphrase !== TESTNET_PASSPHRASE) {
    throw new Error("Refusing to sign: the passphrase is not the Stellar testnet.");
  }
  if (!/^S[A-Z2-7]{55}$/.test(secret)) {
    throw new Error("Refusing to sign: this is not a test secret key.");
  }
}
