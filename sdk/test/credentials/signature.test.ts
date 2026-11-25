import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import { credentialDigest, payloadOf, type Credential } from "../../src/credentials/format.js";
import { signedPayload } from "../../src/signing.js";
import { verifySignature } from "../../src/credentials/verify.js";
import { fixture } from "./format.test.js";

/**
 * The platform's signature, and what it does and does not establish.
 *
 * It says one thing: this credential is the one the named key signed, with
 * nothing changed. It says nothing about whether the claim is true, which is
 * what the evidence check is for — a credential with a perfect signature and a
 * false claim is exactly what `evidence.test.ts` refuses.
 */

const placement = fixture("placement");

describe("a credential the platform signed", () => {
  it("verifies against the key it names", () => {
    const checked = verifySignature(placement);

    expect(checked.valid).toBe(true);
    expect(checked.says).toContain("signed by the key this credential names");
  });

  it("verifies under the same SEP-53 scheme the rest of this SDK signs with", () => {
    /* Not a second signing convention. The payload is the credential's digest,
       written as hex, prefixed and hashed — the same function a judge's
       scorecard signature goes through. */
    const issuer = Keypair.fromPublicKey(placement.issuer.keyId);
    const covered = signedPayload(credentialDigest(payloadOf(placement)));

    expect(issuer.verify(Buffer.from(covered), Buffer.from(placement.signature, "hex"))).toBe(true);
  });
});

describe("a credential somebody edited", () => {
  it("fails, because the signature covers every field", () => {
    const tampered = fixture("tampered");

    expect(verifySignature(tampered).valid).toBe(false);
    expect(verifySignature(tampered).says).toContain("a field has changed");
  });

  it("fails for any field, not only the interesting ones", () => {
    const fields: Partial<Credential>[] = [
      { subject: { address: placement.subject.address, username: "somebody-else" } },
      { evidence: { ...placement.evidence, payoutTxHash: "ff".repeat(32) } },
      { issuer: { ...placement.issuer, signedAt: "2026-01-01T00:00:00.000Z" } },
    ];

    for (const change of fields) {
      expect(verifySignature({ ...placement, ...change } as Credential).valid, JSON.stringify(change)).toBe(false);
    }
  });

  it("fails when the signature is replaced with another key's over the same bytes", () => {
    const stranger = Keypair.random();
    const forged = stranger
      .sign(Buffer.from(signedPayload(credentialDigest(payloadOf(placement)))))
      .toString("hex");

    /* The signature is valid — for the wrong key. Verification is against the
       key the credential names, so a stranger signing the same bytes gains
       nothing. */
    expect(verifySignature({ ...placement, signature: forged }).valid).toBe(false);
  });

  it("fails when the key id is swapped for the stranger who signed it", () => {
    const stranger = Keypair.random();
    const credential: Credential = {
      ...placement,
      issuer: { ...placement.issuer, keyId: stranger.publicKey() },
    };
    const forged = stranger
      .sign(Buffer.from(signedPayload(credentialDigest(payloadOf(credential)))))
      .toString("hex");

    /* This one does verify: a credential signed by a key that names itself is
       internally consistent, which is why the key id is not enough on its own
       and `docs/credentials-trust.md` says a reader must check the key id
       against the platform's published one. */
    expect(verifySignature({ ...credential, signature: forged }).valid).toBe(true);
    expect(credential.issuer.keyId).not.toBe(placement.issuer.keyId);
  });
});

describe("a credential with an unusable signature or key", () => {
  it("is refused rather than throwing", () => {
    expect(verifySignature({ ...placement, issuer: { ...placement.issuer, keyId: "GNOPE" } })).toMatchObject({
      valid: false,
      says: "the issuer's key id is not a Stellar public key",
    });
    expect(verifySignature({ ...placement, signature: "zz".repeat(64) })).toMatchObject({
      valid: false,
      says: "the signature is not a 64 byte hex signature",
    });
    /* Short, long and empty all answer the same way rather than throwing from
       inside the crypto library. */
    for (const signature of ["", "ab", "ab".repeat(100)]) {
      expect(verifySignature({ ...placement, signature }).valid, signature.length.toString()).toBe(false);
    }
  });
});
