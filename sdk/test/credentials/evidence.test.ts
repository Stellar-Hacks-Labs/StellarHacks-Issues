import { describe, expect, it } from "vitest";

import { coverageOf, problemsAgainstEvidence, revealed, type ObservedEvent } from "../../src/credentials/evidence.js";
import type { Credential } from "../../src/credentials/format.js";
import { fixture } from "./format.test.js";

/**
 * The claim against the chain, which is the half that needs no trust in us.
 *
 * A signature says the platform assembled a credential. These checks say
 * whether what it assembled is what the records show, and they are the reason
 * this format is worth more than a PDF: the reader brings the records and the
 * comparison names every field that disagrees.
 */

const placement = fixture("placement");
const participation = fixture("participation");

const observed: ObservedEvent = {
  contract: placement.evidence.contract,
  phase: 7,
  constitutionHash: "cd".repeat(32),
  scoreRoot: "22".repeat(32),
  placements: [
    { track: "ai", rank: 1, team: 3, finalScore: 9_000 },
    { track: "ai", rank: 2, team: 5, finalScore: 7_000 },
  ],
  payments: [
    { track: "ai", rank: 1, recipient: placement.subject.address, kind: 0, txHash: "ab".repeat(32) },
  ],
  members: [{ team: 3, address: placement.subject.address }],
  submissions: [{ team: 3, digest: "11".repeat(32) }],
};

describe("a true placement credential", () => {
  it("disagrees with the records nowhere", () => {
    expect(problemsAgainstEvidence(placement, observed)).toEqual([]);
  });

  it("is confirmed field by field rather than as a whole", () => {
    /* Each of these would be a separate lie, and each is caught on its own: the
       rank, the score, the team, the payout and the rules digest. */
    const lies: [string, Credential][] = [
      ["claim.rank", { ...placement, claim: { ...placement.claim, rank: 2 } } as Credential],
      ["claim.finalScore", { ...placement, claim: { ...placement.claim, finalScore: 10_000 } } as Credential],
      ["claim.team", { ...placement, claim: { ...placement.claim, team: 5 } } as Credential],
      [
        "evidence.payoutTxHash",
        { ...placement, evidence: { ...placement.evidence, payoutTxHash: "ff".repeat(32) } },
      ],
      [
        "evidence.constitutionHash",
        { ...placement, evidence: { ...placement.evidence, constitutionHash: "ee".repeat(32) } },
      ],
      [
        "evidence.submissionDigest",
        { ...placement, evidence: { ...placement.evidence, submissionDigest: "99".repeat(32) } },
      ],
      ["evidence.scoreRoot", { ...placement, evidence: { ...placement.evidence, scoreRoot: "77".repeat(32) } }],
    ];

    for (const [field, lying] of lies) {
      expect(problemsAgainstEvidence(lying, observed).map((problem) => problem.field), field).toContain(field);
    }
  });

  it("names the committed tampered fixture's changed field", () => {
    const tampered = fixture("tampered");
    const problems = problemsAgainstEvidence(tampered, observed);

    // The fixture's score was edited from 9,000 to 10,000 with the signature
    // left alone. The signature check fails as a whole; this is what says where.
    expect(problems).toEqual([
      { field: "claim.finalScore", says: "says 10000; the ranking says 9000" },
    ]);
  });

  it("refuses a credential about a different event than the records", () => {
    const elsewhere = { ...observed, contract: "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE" };
    const problems = problemsAgainstEvidence(placement, elsewhere);

    /* One problem and no further comparison: every other field is about an
       event these records are not for, so reporting them would be noise. */
    expect(problems).toHaveLength(1);
    expect(problems[0]!.field).toBe("evidence.contract");
  });

  it("refuses a score carried for an event that has not revealed", () => {
    const sealed = { ...observed, phase: 4 };
    const problems = problemsAgainstEvidence(placement, sealed).map((problem) => problem.says);

    expect(problems).toContain("carries a score for an event that has not revealed");
  });

  it("accepts a placement whose score is honestly absent before the reveal", () => {
    const sealed = { ...observed, phase: 4, placements: [{ track: "ai", rank: 1, team: 3, finalScore: null }] };
    const withoutScore = { ...placement, claim: { ...placement.claim, finalScore: null } } as Credential;

    expect(problemsAgainstEvidence(withoutScore, sealed)).toEqual([]);
  });

  it("refuses a placement in a track the records do not rank", () => {
    const problems = problemsAgainstEvidence(
      { ...placement, claim: { ...placement.claim, track: "tooling" } } as Credential,
      observed,
    );

    expect(problems.map((problem) => problem.field)).toContain("claim.track");
  });

  it("refuses a subject the chain does not place in that team", () => {
    const problems = problemsAgainstEvidence(placement, { ...observed, members: [] });

    expect(problems.map((problem) => problem.field)).toContain("claim.team");
  });
});

describe("a participation credential", () => {
  it("is accepted for a judge, who is not a team member", () => {
    // A judge has no team, so an absent membership says nothing about them.
    expect(problemsAgainstEvidence(participation, observed)).toEqual([]);
  });

  it("refuses a builder claim with no team membership behind it", () => {
    const builder = {
      ...participation,
      claim: { kind: "participation" as const, role: "builder" as const, team: null },
    };

    expect(
      problemsAgainstEvidence(builder as Credential, { ...observed, members: [] }).map((one) => one.field),
    ).toContain("claim.role");
  });

  it("refuses a named team the chain does not record the subject in", () => {
    const builder = {
      ...participation,
      claim: { kind: "participation" as const, role: "builder" as const, team: 9 },
    };

    expect(problemsAgainstEvidence(builder as Credential, observed).map((one) => one.field)).toContain("claim.team");
  });
});

describe("whether the records were enough to check anything", () => {
  it("says so when a reader brought thin evidence", () => {
    const thin: ObservedEvent = {
      ...observed,
      placements: [],
      members: [],
      payments: [],
      constitutionHash: null,
    };
    const notes = coverageOf(placement, thin);

    /* The important case: with nothing to compare against, nothing disagrees.
       A reader told "no problems" there would read it as confirmation. */
    expect(notes).toHaveLength(4);
    expect(notes.join(" ")).toContain("no ranking");
    expect(notes.join(" ")).toContain("no team membership");
    expect(notes.join(" ")).toContain("no payments");
    expect(notes.join(" ")).toContain("no rules digest");
  });

  it("says nothing when the records cover the claim", () => {
    expect(coverageOf(placement, observed)).toEqual([]);
  });
});

describe("the reveal", () => {
  it("is phase five onwards, as the contract numbers it", () => {
    expect([null, 0, 4].map(revealed)).toEqual([false, false, false]);
    expect([5, 6, 7, 8].map(revealed)).toEqual([true, true, true, true]);
  });
});
