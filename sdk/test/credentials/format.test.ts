import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CREDENTIAL_DOMAIN,
  CREDENTIAL_VERSION,
  canonicalize,
  credentialId,
  payloadOf,
  problemsWithFormat,
  type Credential,
} from "../../src/credentials/format.js";

export function fixture(name: string): Credential {
  const path = join(import.meta.dirname, "..", "..", "..", "fixtures", "credentials", `${name}.json`);

  return JSON.parse(readFileSync(path, "utf8")) as Credential;
}

const placement = fixture("placement");

describe("a credential's shape", () => {
  it("accepts the committed fixtures", () => {
    expect(problemsWithFormat(placement)).toEqual([]);
    expect(problemsWithFormat(fixture("participation"))).toEqual([]);
    /* The tampered one is a well formed credential: its claim was edited, not
       its shape. Shape and truth are different questions and the format check
       must not conflate them. */
    expect(problemsWithFormat(fixture("tampered"))).toEqual([]);
  });

  it("refuses anything that is not a credential object", () => {
    for (const value of [null, "a credential, honest", 7, [placement]]) {
      expect(problemsWithFormat(value)).toEqual([{ field: "$", says: "is not a credential object" }]);
    }
  });

  it("refuses a version it does not know, rather than guessing the fields", () => {
    expect(problemsWithFormat({ ...placement, version: "stelhacks.credential.v2" })).toEqual([
      { field: "version", says: `is not ${CREDENTIAL_VERSION}` },
    ]);
  });

  it("names every field that is wrong, not only the first", () => {
    const problems = problemsWithFormat({
      ...placement,
      signature: "nope",
      subject: { address: "GNOPE", username: 7 },
    });

    expect(problems.map((problem) => problem.field)).toEqual([
      "signature",
      "subject.address",
      "subject.username",
    ]);
  });

  it("refuses a placing of zero, which is the contract's way of saying no position", () => {
    expect(
      problemsWithFormat({ ...placement, claim: { ...placement.claim, rank: 0 } }).map((one) => one.field),
    ).toEqual(["claim.rank"]);
  });

  it("refuses a claim that is neither a placement nor participation", () => {
    expect(problemsWithFormat({ ...placement, claim: { kind: "winner" } })).toEqual([
      { field: "claim.kind", says: "is neither placement nor participation" },
    ]);
  });

  it("refuses a role nobody has", () => {
    const problems = problemsWithFormat({
      ...placement,
      claim: { kind: "participation", role: "mascot", team: null },
    });

    expect(problems.map((problem) => problem.field)).toEqual(["claim.role"]);
  });

  it("requires every evidence digest to be a digest or honestly absent", () => {
    expect(
      problemsWithFormat({
        ...placement,
        evidence: { ...placement.evidence, payoutTxHash: "soon", constitutionHash: null },
      }).map((one) => one.field),
    ).toEqual(["evidence.payoutTxHash"]);
  });

  it("requires an issuer with a key id and a time", () => {
    expect(
      problemsWithFormat({ ...placement, issuer: { keyId: "not-a-key", signedAt: "whenever" } }).map(
        (one) => one.field,
      ),
    ).toEqual(["issuer.keyId", "issuer.signedAt"]);
  });
});

describe("the canonical form", () => {
  it("sorts keys, so two readers who reformatted it hash the same thing", () => {
    const reordered = {
      signature: placement.signature,
      issuer: placement.issuer,
      evidence: placement.evidence,
      claim: placement.claim,
      subject: placement.subject,
      version: placement.version,
    } as Credential;

    expect(canonicalize(payloadOf(reordered))).toBe(canonicalize(payloadOf(placement)));
    expect(credentialId(payloadOf(reordered))).toBe(credentialId(payloadOf(placement)));
  });

  it("leaves the signature out, because a signature cannot cover itself", () => {
    expect(canonicalize(payloadOf(placement))).not.toContain(placement.signature);
  });

  it("has no whitespace, so a formatter cannot change the digest", () => {
    expect(canonicalize(payloadOf(placement))).not.toMatch(/\n|\s{2}/);
  });

  it("changes the id when any field changes", () => {
    const edited = { ...placement, claim: { ...placement.claim, rank: 2 } } as Credential;

    expect(credentialId(payloadOf(edited))).not.toBe(credentialId(payloadOf(placement)));
  });

  it("is domain tagged, so a credential digest cannot collide with another kind", () => {
    // The tag is part of the hashed bytes rather than of the JSON, which is why
    // it is asserted here rather than looked for in the canonical string.
    expect(CREDENTIAL_DOMAIN).toBe("stelhacks.v1.credential");
    expect(credentialId(payloadOf(placement))).toMatch(/^[0-9a-f]{64}$/);
  });
});
