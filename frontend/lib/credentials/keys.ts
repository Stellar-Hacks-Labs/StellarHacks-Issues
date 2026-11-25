/**
 * The platform's signing key, and the one rule about it.
 *
 * It never reaches the browser. Not "should not" — cannot: the secret is read
 * from `STELHACKS_CREDENTIAL_SECRET`, which has no `NEXT_PUBLIC_` prefix and so
 * is never inlined into a client bundle by Next, and `signingKeypair` throws if
 * it is ever called where `window` exists. The key id is the public half and is
 * safe anywhere, which is why it is a separate function rather than a field on
 * the same object.
 *
 * A credential signed by a key nobody can check is worth nothing, so the key id
 * travels on every credential and the trust assumption it carries is written
 * down in `docs/credentials-trust.md`: a reader has to compare it against the
 * key this platform publishes, or the signature only proves internal
 * consistency.
 */

import { Keypair, StrKey } from "@stellar/stellar-sdk";

const SECRET = "STELHACKS_CREDENTIAL_SECRET";
const PUBLIC = "NEXT_PUBLIC_STELHACKS_CREDENTIAL_KEY_ID";

export class CredentialKeyError extends Error {}

/** Whether this deployment can sign credentials at all. */
export function signingConfigured(): boolean {
  return (process.env[SECRET] ?? "").length > 0;
}

/**
 * The keypair that signs, for server code only.
 *
 * Throws rather than returning null, because every caller is a route that has
 * already decided a credential is being issued: a null here would turn a
 * misconfigured deployment into an unsigned credential, which is worse than an
 * error somebody has to read.
 */
export function signingKeypair(): Keypair {
  if (typeof window !== "undefined") {
    /* Belt and braces with the missing NEXT_PUBLIC_ prefix. If a refactor ever
       pulls this module into a client component, this is what fails loudly
       rather than shipping a secret to every visitor. */
    throw new CredentialKeyError("the credential signing key is server side only");
  }

  const secret = process.env[SECRET] ?? "";

  if (secret.length === 0) {
    throw new CredentialKeyError(`${SECRET} is not set; this deployment cannot sign credentials`);
  }
  if (!StrKey.isValidEd25519SecretSeed(secret)) {
    throw new CredentialKeyError(`${SECRET} is not a Stellar secret seed`);
  }

  return Keypair.fromSecret(secret);
}

/**
 * The key id a credential carries, as anybody may read it.
 *
 * Taken from the public environment variable when one is set, so a browser can
 * show which key it expects without the server being asked. When only the
 * secret is configured, the id is derived from it — on the server, where the
 * secret already is.
 */
export function keyId(): string | null {
  const published = process.env[PUBLIC] ?? "";

  if (StrKey.isValidEd25519PublicKey(published)) {
    return published;
  }
  if (typeof window !== "undefined" || !signingConfigured()) {
    return null;
  }

  try {
    return signingKeypair().publicKey();
  } catch {
    return null;
  }
}

/**
 * Whether a credential names the key this deployment publishes.
 *
 * The check a reader cannot skip. A credential signed by some other key
 * verifies perfectly against itself, so "the signature is valid" means nothing
 * until the key id is the expected one.
 */
export function issuedByUs(credentialKeyId: string): boolean {
  const ours = keyId();

  return ours !== null && ours === credentialKeyId;
}
