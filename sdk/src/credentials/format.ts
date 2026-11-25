import { hash } from "@stellar/stellar-sdk";

import { toHex } from "../hex.js";
import type { Digest } from "../merkle.js";

/**
 * What a builder can export about themselves, and what it is worth.
 *
 * Decision 8 says a builder's profile is derived from records rather than from
 * declarations. That derivation currently lives inside the website, which means
 * the honest version of a builder's history is something only this site can
 * compute — and a builder applying for a job, a grant or a delegation cannot
 * hand that over.
 *
 * A credential is that derivation, written down, signed by the platform, and
 * pointing at the chain. The signature is the weakest of the three and is
 * deliberately not the interesting one: it says *we* assembled this. The
 * evidence links are what make it checkable by somebody who does not care what
 * we say, which is the whole point — see `evidence.ts` and
 * `docs/credentials-trust.md`.
 *
 * Canonical form is sorted-key JSON with no whitespace, hashed under a domain
 * tag of its own. The tag is defined here rather than in `hashing.ts` on
 * purpose: that module mirrors the contract's `hashing.rs` byte for byte, and a
 * credential is off chain only — the contract neither produces nor verifies
 * one, so putting its domain beside the on chain ones would imply a Rust
 * counterpart that must not exist.
 */

export const CREDENTIAL_VERSION = "stelhacks.credential.v1" as const;

/** The domain tag credential digests are taken under. Off chain only. */
export const CREDENTIAL_DOMAIN = "stelhacks.v1.credential" as const;

export type CredentialRole = "builder" | "judge" | "organizer" | "sponsor";

/** A placement: this subject's team placed here, in this track, at this event. */
export interface PlacementClaim {
  kind: "placement";
  track: string;
  rank: number;
  team: number;
  /** The combined score at the contract's own scale, when the event has revealed it. */
  finalScore: number | null;
}

/** Participation: this subject took part, in this role, without a placing claim. */
export interface ParticipationClaim {
  kind: "participation";
  role: CredentialRole;
  team: number | null;
}

export type CredentialClaim = PlacementClaim | ParticipationClaim;

/**
 * Where to go to check the claim without asking us.
 *
 * Every field is something a stranger can read off the chain or the public
 * API. A credential whose evidence is a link back to the page that issued it
 * would be a credential that proves nothing.
 */
export interface CredentialEvidence {
  /** The hackathon contract, which is the identity everything else keys on. */
  contract: string;
  /** Its slug on this platform, for a reader who wants the human page too. */
  slug: string | null;
  /** The digest of the frozen rules, so a reader can confirm which competition this was. */
  constitutionHash: string | null;
  /** The transaction that paid the placing, when one was paid. */
  payoutTxHash: string | null;
  /** The digest the contract pinned for the team's submission, when there is one. */
  submissionDigest: string | null;
  /** The root committing to every sealed scorecard, once published. */
  scoreRoot: string | null;
}

export interface CredentialSubject {
  /** The address the chain recorded doing this. The claim is about a key, not a person. */
  address: string;
  /** This platform's username for that address, when it has one. Convenience, not identity. */
  username: string | null;
}

export interface CredentialIssuer {
  /** The platform's signing key, as a Stellar public key. Also the key id. */
  keyId: string;
  /** When the credential was assembled, ISO 8601. */
  signedAt: string;
}

/** The part a signature covers: everything except the signature itself. */
export interface CredentialPayload {
  version: typeof CREDENTIAL_VERSION;
  subject: CredentialSubject;
  claim: CredentialClaim;
  evidence: CredentialEvidence;
  issuer: CredentialIssuer;
}

export interface Credential extends CredentialPayload {
  /** Hex, 128 characters: the platform's signature over this credential's digest. */
  signature: string;
}

export interface FormatProblem {
  field: string;
  says: string;
}

const ADDRESS = /^G[A-Z2-7]{55}$/;
const CONTRACT = /^C[A-Z2-7]{55}$/;
const HEX32 = /^[0-9a-f]{64}$/;
const SIGNATURE = /^[0-9a-f]{128}$/;

/**
 * Whether this is a credential at all, as a list of what is wrong with it.
 *
 * Shape before signature, always. A reader who pasted half a credential should
 * be told that, not told that a signature failed — and `verify` leans on this
 * so it never has to reason about a field that might be missing.
 */
export function problemsWithFormat(value: unknown): FormatProblem[] {
  const problems: FormatProblem[] = [];
  const say = (field: string, says: string) => problems.push({ field, says });

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [{ field: "$", says: "is not a credential object" }];
  }

  const credential = value as Record<string, unknown>;

  if (credential["version"] !== CREDENTIAL_VERSION) {
    say("version", `is not ${CREDENTIAL_VERSION}`);
  }
  if (typeof credential["signature"] !== "string" || !SIGNATURE.test(credential["signature"])) {
    say("signature", "is not a 64 byte hex signature");
  }

  const subject = credential["subject"] as Record<string, unknown> | undefined;

  if (subject === undefined || typeof subject !== "object") {
    say("subject", "is missing");
  } else {
    if (typeof subject["address"] !== "string" || !ADDRESS.test(subject["address"])) {
      say("subject.address", "is not a Stellar account address");
    }
    if (subject["username"] !== null && typeof subject["username"] !== "string") {
      say("subject.username", "is neither a username nor null");
    }
  }

  problems.push(...claimProblems(credential["claim"]));
  problems.push(...evidenceProblems(credential["evidence"]));

  const issuer = credential["issuer"] as Record<string, unknown> | undefined;

  if (issuer === undefined || typeof issuer !== "object") {
    say("issuer", "is missing");
  } else {
    if (typeof issuer["keyId"] !== "string" || !ADDRESS.test(issuer["keyId"])) {
      say("issuer.keyId", "is not a Stellar account address");
    }
    if (typeof issuer["signedAt"] !== "string" || !Number.isFinite(Date.parse(issuer["signedAt"]))) {
      say("issuer.signedAt", "is not a time");
    }
  }

  return problems;
}

function claimProblems(value: unknown): FormatProblem[] {
  if (value === null || typeof value !== "object") {
    return [{ field: "claim", says: "is missing" }];
  }

  const claim = value as Record<string, unknown>;

  if (claim["kind"] === "placement") {
    const problems: FormatProblem[] = [];

    if (typeof claim["track"] !== "string" || claim["track"].length === 0) {
      problems.push({ field: "claim.track", says: "is missing" });
    }
    if (!Number.isInteger(claim["rank"]) || (claim["rank"] as number) < 1) {
      /* Rank zero is the contract's "no position"; a placement claiming it is
         a claim about nothing. */
      problems.push({ field: "claim.rank", says: "is not a placing of one or better" });
    }
    if (!Number.isInteger(claim["team"]) || (claim["team"] as number) < 1) {
      problems.push({ field: "claim.team", says: "is not a team number" });
    }
    if (claim["finalScore"] !== null && !Number.isInteger(claim["finalScore"])) {
      problems.push({ field: "claim.finalScore", says: "is neither a whole score nor null" });
    }

    return problems;
  }

  if (claim["kind"] === "participation") {
    const roles: CredentialRole[] = ["builder", "judge", "organizer", "sponsor"];
    const problems: FormatProblem[] = [];

    if (!roles.includes(claim["role"] as CredentialRole)) {
      problems.push({ field: "claim.role", says: `is not one of ${roles.join(", ")}` });
    }
    if (claim["team"] !== null && (!Number.isInteger(claim["team"]) || (claim["team"] as number) < 1)) {
      problems.push({ field: "claim.team", says: "is neither a team number nor null" });
    }

    return problems;
  }

  return [{ field: "claim.kind", says: "is neither placement nor participation" }];
}

function evidenceProblems(value: unknown): FormatProblem[] {
  if (value === null || typeof value !== "object") {
    return [{ field: "evidence", says: "is missing" }];
  }

  const evidence = value as Record<string, unknown>;
  const problems: FormatProblem[] = [];

  if (typeof evidence["contract"] !== "string" || !CONTRACT.test(evidence["contract"])) {
    problems.push({ field: "evidence.contract", says: "is not a contract address" });
  }
  if (evidence["slug"] !== null && typeof evidence["slug"] !== "string") {
    problems.push({ field: "evidence.slug", says: "is neither a slug nor null" });
  }

  for (const field of ["constitutionHash", "payoutTxHash", "submissionDigest", "scoreRoot"] as const) {
    const held = evidence[field];

    if (held !== null && (typeof held !== "string" || !HEX32.test(held))) {
      problems.push({ field: `evidence.${field}`, says: "is neither a 32 byte hex digest nor null" });
    }
  }

  return problems;
}

/**
 * The credential as the bytes a signature covers.
 *
 * Sorted keys and no whitespace, so two readers who received the same
 * credential through different JSON libraries hash the same thing. Without
 * that, a credential that passed through a formatter would stop verifying and
 * look tampered with.
 */
export function canonicalize(payload: CredentialPayload): string {
  return JSON.stringify(sorted(payload as unknown as Record<string, unknown>));
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sorted);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    /* Undefined is dropped rather than serialized, because `JSON.stringify`
       drops it anyway and a payload whose canonical form depended on key order
       would be a payload two libraries disagree about. */
    .filter(([, held]) => held !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

  return Object.fromEntries(entries.map(([key, held]) => [key, sorted(held)]));
}

/** Everything but the signature, which is what a digest is taken over. */
export function payloadOf(credential: Credential): CredentialPayload {
  const { signature, ...payload } = credential;

  void signature;

  return payload as CredentialPayload;
}

/**
 * The digest a credential's signature covers.
 *
 * Domain tagged, like every other digest in this system, so a credential's
 * digest can never collide with a constitution's or a scorecard leaf's.
 */
export function credentialDigest(payload: CredentialPayload): Digest {
  const tagged = new TextEncoder().encode(`${CREDENTIAL_DOMAIN}:${canonicalize(payload)}`);

  return new Uint8Array(hash(Buffer.from(tagged)));
}

/** The digest as hex, which is what a page shows beside a credential. */
export function credentialId(payload: CredentialPayload): string {
  return toHex(credentialDigest(payload));
}
