import { hash, Keypair } from "@stellar/stellar-sdk";

/**
 * Signing a credential, the same way everything else in this product signs.
 *
 * The scheme is the SDK's: the credential's canonical JSON is hashed under its
 * own domain tag, and that digest is signed as hexadecimal text under SEP-53.
 * Written here rather than imported because the web application does not depend
 * on `@stelhacks/sdk` — shipping the whole SDK to a browser to sign nothing
 * would be the wrong trade, and the fixtures in `fixtures/credentials/` are
 * what keep the two implementations honest: they were produced by the SDK and
 * `sign.test.ts` reproduces their signatures here.
 *
 * The secret never appears in this module's signature: callers hand over a
 * keypair from `keys.ts`, which refuses to exist in a browser.
 */

export const CREDENTIAL_DOMAIN = "stelhacks.v1.credential" as const;

/** SEP-53's fixed prefix, which keeps a signed message from being replayable as a transaction. */
const SEP53_PREFIX = "Stellar Signed Message:\n";

/** Sorted keys, no whitespace: two readers with different JSON libraries hash the same bytes. */
export function canonicalize(payload: unknown): string {
  return JSON.stringify(sorted(payload));
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sorted);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, held]) => held !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, held]) => [key, sorted(held)]),
  );
}

/** The digest a credential's signature covers, domain tagged. */
export function credentialDigest(payload: unknown): Uint8Array {
  const tagged = new TextEncoder().encode(`${CREDENTIAL_DOMAIN}:${canonicalize(payload)}`);

  return new Uint8Array(hash(Buffer.from(tagged)));
}

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * The bytes SEP-53 actually signs: the digest as hex, prefixed, then hashed.
 *
 * Signing the raw digest instead would produce something no wallet and no
 * other SEP-53 implementation agrees with, which is exactly the kind of
 * mistake that only shows up at somebody else's verifier.
 */
export function signedPayload(digest: Uint8Array): Uint8Array {
  const message = new TextEncoder().encode(toHex(digest));
  const prefix = new TextEncoder().encode(SEP53_PREFIX);
  const joined = new Uint8Array(prefix.length + message.length);

  joined.set(prefix);
  joined.set(message, prefix.length);

  return new Uint8Array(hash(Buffer.from(joined)));
}

/** The credential's own id, which is its digest as hex. */
export function credentialId(payload: unknown): string {
  return toHex(credentialDigest(payload));
}

/** Signs one payload, returning the signature as hex. */
export function signPayload(payload: unknown, keypair: Keypair): string {
  /* Wrapped rather than `.toString("hex")` on the result: this version of the
     Stellar SDK returns a `Uint8Array`, whose `toString` takes no encoding and
     would quietly produce a comma separated list of bytes. */
  return Buffer.from(keypair.sign(Buffer.from(signedPayload(credentialDigest(payload))))).toString("hex");
}

/**
 * Whether a signature covers this payload, for the key it names.
 *
 * Used by the verification page, which runs in a browser: the signature half of
 * verification needs no network and no SDK, so a reader checking a credential
 * on our site gets the same answer they would get offline — and the page says
 * plainly that the evidence half is the one that does not depend on us.
 */
export function verifyPayload(payload: unknown, signature: string, keyId: string): boolean {
  if (!/^[0-9a-f]{128}$/.test(signature)) {
    return false;
  }

  try {
    return Keypair.fromPublicKey(keyId).verify(
      Buffer.from(signedPayload(credentialDigest(payload))),
      Buffer.from(signature, "hex"),
    );
  } catch {
    /* An unusable key id is a refusal, not a crash: the string arrived in a
       credential somebody pasted. */
    return false;
  }
}
