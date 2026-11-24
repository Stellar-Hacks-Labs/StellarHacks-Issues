/**
 * Strict-mode commitments and disclosures.
 *
 * In the easy mode a collection service seals every scorecard behind one
 * Merkle root. In the strict mode each judge posts a commitment themselves
 * during the judging window and opens it after the deadline. The scorecard
 * shape is the same either way; only who holds the seal changes.
 *
 * The salt blinds the marks. Without it an observer who knows the rubric
 * could brute-force every plausible combination and read the scores before
 * the window closed. Sixteen random bytes close that door for any scorecard
 * a hackathon actually produces.
 */

import { hash } from "@stellar/stellar-sdk";
import type { Scorecard } from "hackathon-core";

import { encode } from "./hashing.js";
import type { Digest } from "./merkle.js";

/** Domain tag, matching `commitments.rs` byte for byte. */
const COMMITMENT_DOMAIN = "stelhacks.v1.scorecard-commitment";

/** Sixteen random bytes, the minimum the PRD asks for. */
export type Salt = Uint8Array;

/** Build a cryptographically random sixteen-byte salt. */
export function randomSalt(bytes: number = 16): Salt {
  if (bytes < 16) {
    throw new Error("a strict-mode salt has to be at least sixteen bytes");
  }

  const salt = new Uint8Array(bytes);
  crypto.getRandomValues(salt);

  return salt;
}

/**
 * The digest a judge posts during the judging window.
 *
 * Payload is the domain, then the scorecard's XDR, then the salt — the same
 * layout the contract hashes when it checks a disclose.
 */
export function scorecardCommitment(scorecard: Scorecard, salt: Salt): Digest {
  if (salt.length < 16) {
    throw new Error("a strict-mode salt has to be at least sixteen bytes");
  }

  const body = concat(encode(scorecard, "Scorecard"), salt);

  return sha256(concat(text(COMMITMENT_DOMAIN), body));
}

/** Whether a disclosure opens the commitment that was posted. */
export function commitmentMatches(
  scorecard: Scorecard,
  salt: Salt,
  commitment: Digest | Uint8Array,
): boolean {
  const expected = scorecardCommitment(scorecard, salt);

  if (expected.length !== commitment.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] !== commitment[i]) {
      return false;
    }
  }

  return true;
}

function sha256(payload: Uint8Array): Digest {
  return new Uint8Array(hash(Buffer.from(payload)));
}

function text(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);

  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }

  return out;
}
