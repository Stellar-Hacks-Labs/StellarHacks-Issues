import { describe, expect, it } from "vitest";

import type { ObservedEvent } from "../../src/credentials/evidence.js";
import type { Credential } from "../../src/credentials/format.js";
import { canonicalCredential, changedFields, verifyCredential } from "../../src/credentials/verify.js";
import { fixture } from "./format.test.js";

/**
 * The whole check, in the order a reader's doubts arrive.
 *
 * Shape, then signature, then evidence — reported separately because they
 * answer different questions, and a reader who has only the credential can
 * still get a useful answer from the first two. The property this suite exists
 * to defend is the one the issue names: a tampered credential fails **at the
 * changed field**, not as an unexplained refusal.
 */

const placement = fixture("placement");

const observed: ObservedEvent = {
  contract: placement.evidence.contract,
  phase: 7,
  constitutionHash: "cd".repeat(32),
  scoreRoot: "22".repeat(32),
  placements: [{ track: "ai", rank: 1, team: 3, finalScore: 9_000 }],
  payments: [{ track: "ai", rank: 1, recipient: placement.subject.address, kind: 0, txHash: "ab".repeat(32) }],
  members: [{ team: 3, address: placement.subject.address }],
  submissions: [{ team: 3, digest: "11".repeat(32) }],
};

describe("a credential that is what it says it is", () => {
  it("passes every layer, and reports its own id", () => {
    const report = verifyCredential(placement, observed);

    expect(report.ok).toBe(true);
    expect(report.format).toEqual([]);
    expect(report.signature).toMatchObject({ valid: true, keyId: placement.issuer.keyId });
    expect(report.evidence).toEqual([]);
    expect(report.coverage).toEqual([]);
    expect(report.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("can be checked with the credential alone, and says the claim was not", () => {
    const report = verifyCredential(placement);

    /* No records brought: the signature still establishes that we assembled
       this exact credential, and `evidence: null` says plainly that the claim
       itself was compared against nothing. */
    expect(report.ok).toBe(true);
    expect(report.signature?.valid).toBe(true);
    expect(report.evidence).toBeNull();
  });
});

describe("a tampered credential", () => {
  const tampered = fixture("tampered");

  it("fails, and names the field that changed", () => {
    const report = verifyCredential(tampered, observed);

    expect(report.ok).toBe(false);
    expect(report.signature?.valid).toBe(false);
    expect(changedFields(report)).toEqual(["claim.finalScore"]);
  });

  it("fails on the signature even when no records are available to compare", () => {
    const report = verifyCredential(tampered);

    expect(report.ok).toBe(false);
    expect(report.signature?.says).toContain("a field has changed");
    /* With nothing to compare against, the field cannot be named — which is
       why the evidence half exists and why a reader is told to bring records. */
    expect(changedFields(report)).toEqual([]);
  });

  it("is reported at every changed field when several moved", () => {
    const rewritten: Credential = {
      ...tampered,
      claim: { kind: "placement", track: "ai", rank: 2, team: 3, finalScore: 10_000 },
    };

    /* Three, not two: moving the rank also breaks the payout link, because the
       ledger paid rank one and this credential now claims rank two. A forger
       editing one field has to edit the chain to match it. */
    expect(changedFields(verifyCredential(rewritten, observed)).sort()).toEqual([
      "claim.finalScore",
      "claim.rank",
      "evidence.payoutTxHash",
    ]);
  });
});

describe("something that is not a credential", () => {
  it("is refused on shape, before any signature is attempted", () => {
    const report = verifyCredential({ version: "stelhacks.credential.v1" });

    expect(report.ok).toBe(false);
    expect(report.signature).toBeNull();
    expect(report.evidence).toBeNull();
    expect(changedFields(report)).toContain("signature");
  });

  it("is refused for a paste that is not an object at all", () => {
    for (const value of [null, "{}", 7, []]) {
      expect(verifyCredential(value).format).toEqual([{ field: "$", says: "is not a credential object" }]);
    }
  });
});

describe("a credential with a good signature and a false claim", () => {
  it("is the case this format exists to catch", () => {
    /* Signed by its own issuer, internally perfect, and contradicted by the
       chain. A reader who stopped at the signature would accept it. */
    const report = verifyCredential(placement, {
      ...observed,
      placements: [{ track: "ai", rank: 4, team: 3, finalScore: 9_000 }],
    });

    expect(report.signature?.valid).toBe(true);
    expect(report.ok).toBe(false);
    expect(changedFields(report)).toEqual(["claim.rank"]);
  });
});

describe("the canonical bytes", () => {
  it("are what a reader hashes to reach the same id", () => {
    const canonical = canonicalCredential(placement);

    expect(canonical.startsWith("{")).toBe(true);
    expect(canonical).not.toContain(placement.signature);
    expect(JSON.parse(canonical).claim.rank).toBe(1);
  });
});
