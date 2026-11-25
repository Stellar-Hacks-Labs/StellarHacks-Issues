import { Keypair, StrKey } from "@stellar/stellar-sdk";

import { signedPayload } from "../signing.js";
import {
  canonicalize,
  credentialDigest,
  credentialId,
  payloadOf,
  problemsWithFormat,
  type Credential,
  type FormatProblem,
} from "./format.js";
import { coverageOf, problemsAgainstEvidence, type EvidenceProblem, type ObservedEvent } from "./evidence.js";

/**
 * Checking a credential, in the order a reader's doubts arrive.
 *
 * Three layers, and they are reported separately because they answer different
 * questions:
 *
 *   shape      is this a credential at all
 *   signature  did the platform assemble this one, unaltered
 *   evidence   is what it claims what the chain says
 *
 * A reader who only has the credential can do the first two. A reader who also
 * fetched the event's records can do the third, and that is the one that does
 * not require trusting us at all. Both are useful and neither is a substitute:
 * a credential with a good signature and a false claim is the thing this format
 * exists to make impossible to pass off, and a tampered field is reported *as
 * that field* rather than as a failed signature.
 *
 * Nothing here fetches anything. The caller brings what it read.
 */

export interface CredentialReport {
  /** True when the shape is right, the signature covers it, and nothing disagreed. */
  ok: boolean;
  /** The credential's own digest, which is what a page shows beside it. */
  id: string | null;
  format: FormatProblem[];
  /** Null when the signature was not checked, because the shape made it impossible. */
  signature: { valid: boolean; keyId: string | null; says: string } | null;
  evidence: EvidenceProblem[] | null;
  /** What the records brought could not confirm either way. */
  coverage: string[];
}

/** Whether the platform's signature covers this exact credential. */
export function verifySignature(credential: Credential): { valid: boolean; says: string } {
  const keyId = credential.issuer.keyId;

  if (!StrKey.isValidEd25519PublicKey(keyId)) {
    return { valid: false, says: "the issuer's key id is not a Stellar public key" };
  }

  /* Checked rather than attempted. `Buffer.from` answers a bad hex string with
     a short buffer instead of an error, and handing that to `verify` throws
     from inside the crypto library — which is a crash where a reader deserves
     a sentence. */
  if (!/^[0-9a-f]{128}$/.test(credential.signature)) {
    return { valid: false, says: "the signature is not a 64 byte hex signature" };
  }

  const signature = Buffer.from(credential.signature, "hex");

  /* The same SEP-53 payload the rest of this SDK signs: the digest, written as
     hex, prefixed and hashed. One signing convention for the whole product
     means a credential signature is verifiable by anything that already knows
     how to check a judge's. */
  const covered = signedPayload(credentialDigest(payloadOf(credential)));
  const valid = Keypair.fromPublicKey(keyId).verify(Buffer.from(covered), signature);

  return {
    valid,
    says: valid
      ? "signed by the key this credential names"
      : "this signature does not cover this credential; a field has changed or the key is not the signer",
  };
}

/**
 * The whole check.
 *
 * `observed` is optional so a reader with only the credential still gets a
 * useful answer — and `ok` is false in that case only if the shape or the
 * signature is wrong, with `evidence: null` saying plainly that the claim was
 * not checked against anything.
 */
export function verifyCredential(value: unknown, observed?: ObservedEvent): CredentialReport {
  const format = problemsWithFormat(value);

  if (format.length > 0) {
    return { ok: false, id: null, format, signature: null, evidence: null, coverage: [] };
  }

  const credential = value as Credential;
  const signature = verifySignature(credential);
  const evidence = observed === undefined ? null : problemsAgainstEvidence(credential, observed);
  const coverage = observed === undefined ? [] : coverageOf(credential, observed);

  return {
    ok: signature.valid && (evidence === null || evidence.length === 0),
    id: credentialId(payloadOf(credential)),
    format: [],
    signature: { valid: signature.valid, keyId: credential.issuer.keyId, says: signature.says },
    evidence,
    coverage,
  };
}

/**
 * Which field a tampered credential was tampered in, when that can be told.
 *
 * A signature covers the whole payload, so an edited credential fails as a
 * whole and the signature alone cannot say where. The evidence comparison can:
 * it checks each claim against the records, so the field that no longer matches
 * the chain is named. This is the function a page uses to point at it.
 */
export function changedFields(report: CredentialReport): string[] {
  if (report.format.length > 0) {
    return report.format.map((problem) => problem.field);
  }

  return (report.evidence ?? []).map((problem) => problem.field);
}

/** The canonical bytes a reader can hash themselves to get the same id. */
export function canonicalCredential(credential: Credential): string {
  return canonicalize(payloadOf(credential));
}
