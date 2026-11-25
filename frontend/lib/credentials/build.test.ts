import { describe, expect, it } from "vitest";

import { build, payloadFor, revealed, type CredentialPayload } from "./build";
import { CONSTITUTION_HASH, CONTRACT, joinedEvent, judgedEvent, judgingEvent, settledEvent, SUBJECT, SUBMISSION_DIGEST, SCORE_ROOT, TX_HASH } from "./fixtures";

const input = {
  subject: { address: SUBJECT, username: "ada" },
  keyId: "GDVEU3DD4KOFECV66VIHWEZOYX4ZKR3WV27L464SIIPOU2IUI3JCZA57",
  now: "2026-11-21T10:00:00.000Z",
};

describe("a settled event the subject placed in", () => {
  const [credential, ...rest] = build({ ...input, events: [settledEvent()] });

  it("becomes one placement claim, with the evidence a reader needs", () => {
    expect(rest).toEqual([]);
    expect(credential).toEqual<CredentialPayload>({
      version: "stelhacks.credential.v1",
      subject: { address: SUBJECT, username: "ada" },
      claim: { kind: "placement", track: "ai", rank: 1, team: 3, finalScore: 9_000 },
      evidence: {
        contract: CONTRACT,
        slug: "a-finished-event",
        constitutionHash: CONSTITUTION_HASH,
        payoutTxHash: TX_HASH,
        submissionDigest: SUBMISSION_DIGEST,
        scoreRoot: SCORE_ROOT,
      },
      issuer: { keyId: input.keyId, signedAt: input.now },
    });
  });

  it("claims nothing about the placings of other teams", () => {
    // The event's ranking also contains team 5 and team 8. Neither is this
    // subject's, and a credential that mentioned them would be a credential
    // about somebody else.
    expect(JSON.stringify(credential)).not.toContain("7000");
    expect(JSON.stringify(credential)).not.toContain("8000");
  });

  it("links the payout that settled that placing, and not a sweep", () => {
    /* Rank two of the same track was swept rather than paid. A credential that
       linked it would be citing money that went back to the pool. */
    expect(credential!.evidence.payoutTxHash).toBe(TX_HASH);
    expect(credential!.evidence.payoutTxHash).not.toBe("ff".repeat(32));
  });
});

describe("an event whose ranking has not been revealed", () => {
  it("yields participation rather than a placement, even though the ranking exists", () => {
    const [credential] = build({ ...input, events: [judgingEvent()] });

    /* The placing is public once the contract has ranked; the score is sealed
       until the reveal. A credential is pasted into forms by people who will
       not read a footnote, so it claims participation until the scores open. */
    expect(credential!.claim).toEqual({ kind: "participation", role: "builder", team: 3 });
  });

  it("carries no score anywhere", () => {
    const [credential] = build({ ...input, events: [judgingEvent()] });

    expect(JSON.stringify(credential)).not.toContain("9000");
  });
});

describe("an event the subject took part in without placing", () => {
  it("becomes a participation claim naming their team", () => {
    const [credential] = build({ ...input, events: [joinedEvent()] });

    expect(credential!.claim).toEqual({ kind: "participation", role: "builder", team: 4 });
    expect(credential!.evidence.payoutTxHash).toBeNull();
  });

  it("claims the role the caller asked for, with no team for a judge", () => {
    const [credential] = build({ ...input, events: [judgedEvent()], role: "judge" });

    expect(credential!.claim).toEqual({ kind: "participation", role: "judge", team: null });
    expect(credential!.evidence.submissionDigest).toBeNull();
  });
});

describe("several events at once", () => {
  it("yields one credential per claim, placements by rank", () => {
    const credentials = build({ ...input, events: [settledEvent(), joinedEvent()] });

    expect(credentials.map((credential) => credential.claim.kind)).toEqual(["placement", "participation"]);
  });

  it("yields one placement per track when a team placed in two", () => {
    const twoTracks = {
      ...settledEvent(),
      placements: [
        { track: "tooling", rank: 2, team: 3, finalScore: 6_000 },
        { track: "ai", rank: 1, team: 3, finalScore: 9_000 },
      ],
    };
    const credentials = build({ ...input, events: [twoTracks] });

    expect(credentials.map((credential) => (credential.claim as { rank: number }).rank)).toEqual([1, 2]);
  });
});

describe("the payload builder", () => {
  it("leaves evidence honestly absent rather than inventing it", () => {
    const sparse = { ...settledEvent(), constitutionHash: null, scoreRoot: null, payments: [], submissions: [] };
    const payload = payloadFor(input, sparse, {
      kind: "placement",
      track: "ai",
      rank: 1,
      team: 3,
      finalScore: 9_000,
    });

    expect(payload.evidence).toEqual({
      contract: CONTRACT,
      slug: "a-finished-event",
      constitutionHash: null,
      payoutTxHash: null,
      submissionDigest: null,
      scoreRoot: null,
    });
  });

  it("normalizes the time it was assembled", () => {
    const payload = payloadFor({ ...input, now: "2026-11-21T10:00:00Z" }, settledEvent(), {
      kind: "participation",
      role: "builder",
      team: 3,
    });

    expect(payload.issuer.signedAt).toBe("2026-11-21T10:00:00.000Z");
  });
});

describe("the reveal", () => {
  it("is phase five onwards", () => {
    expect([null, 0, 4].map(revealed)).toEqual([false, false, false]);
    expect([5, 7].map(revealed)).toEqual([true, true]);
  });
});
