import type { Credential, PlacementClaim } from "./format.js";

/**
 * What the chain says about the claim, and where the two disagree.
 *
 * This is the half of verification that matters. A signature says the platform
 * assembled a credential; it says nothing about whether the claim is true, and
 * a reader who stopped at the signature would be trusting us exactly as much as
 * they would trusting the profile page. The evidence check is what lets them
 * stop trusting us: the claim is compared, field by field, against records the
 * reader fetched themselves.
 *
 * Nothing here fetches. The caller supplies what it read — from the chain, from
 * the public API, from a block explorer — and this compares. That is what makes
 * it usable from a browser, a script or a CI job without this SDK deciding how
 * anybody reaches the network.
 */

/** What a reader looked up for the event the credential names. */
export interface ObservedEvent {
  contract: string;
  /** The event's phase, as the chain or the public API reports it. */
  phase: number | null;
  constitutionHash: string | null;
  scoreRoot: string | null;
  /** The ranking as published, once there is one. */
  placements: readonly { track: string; rank: number; team: number; finalScore: number | null }[];
  /** Payments out of the vault, as the ledger recorded them. */
  payments: readonly { track: string; rank: number; recipient: string; kind: number; txHash: string }[];
  /** Team membership, as the chain recorded it. */
  members: readonly { team: number; address: string }[];
  /** The digest pinned for each team's submission. */
  submissions: readonly { team: number; digest: string | null }[];
}

export interface EvidenceProblem {
  field: string;
  says: string;
}

/** Phase five is the reveal, in the contract's own numbering. */
export const REVEAL_PHASE = 5;

/**
 * Where the credential and the records disagree, named field by field.
 *
 * A list rather than a verdict, because "this credential is wrong" without
 * saying where is not something a reader can act on — and because a tampered
 * field is exactly what a reader needs pointed at.
 */
export function problemsAgainstEvidence(
  credential: Credential,
  observed: ObservedEvent,
): EvidenceProblem[] {
  const problems: EvidenceProblem[] = [];
  const say = (field: string, says: string) => problems.push({ field, says });

  if (credential.evidence.contract !== observed.contract) {
    return [
      {
        field: "evidence.contract",
        says: `names ${credential.evidence.contract}, and these records are for ${observed.contract}`,
      },
    ];
  }

  if (
    credential.evidence.constitutionHash !== null &&
    observed.constitutionHash !== null &&
    credential.evidence.constitutionHash !== observed.constitutionHash
  ) {
    /* The rules digest is how a reader knows which competition this was. A
       mismatch means the credential is about a different set of rules than the
       one the reader is looking at, which matters more than any score. */
    say("evidence.constitutionHash", "is not the digest these records carry");
  }

  if (
    credential.evidence.scoreRoot !== null &&
    observed.scoreRoot !== null &&
    credential.evidence.scoreRoot !== observed.scoreRoot
  ) {
    say("evidence.scoreRoot", "is not the root these records carry");
  }

  const membership = observed.members.filter((member) => member.address === credential.subject.address);

  if (credential.claim.kind === "placement") {
    problems.push(...placementProblems(credential, credential.claim, observed, membership));
  } else if (credential.claim.team !== null) {
    if (!membership.some((member) => member.team === credential.claim.team)) {
      say("claim.team", `says the subject was in team ${credential.claim.team}; the chain does not record that`);
    }
  } else if (membership.length === 0 && credential.claim.role === "builder") {
    /* A builder claim with no team and no membership is a claim nothing
       supports. Judges, organizers and sponsors are not team members, so the
       same absence says nothing about them. */
    say("claim.role", "says the subject built here; the chain records no team membership for them");
  }

  return problems;
}

function placementProblems(
  credential: Credential,
  claim: PlacementClaim,
  observed: ObservedEvent,
  membership: readonly { team: number; address: string }[],
): EvidenceProblem[] {
  const problems: EvidenceProblem[] = [];
  const say = (field: string, says: string) => problems.push({ field, says });

  if (!membership.some((member) => member.team === claim.team)) {
    say("claim.team", `says team ${claim.team}; the chain does not record the subject in it`);
  }

  const placed = observed.placements.filter((placement) => placement.track === claim.track);
  const own = placed.find((placement) => placement.team === claim.team);

  if (placed.length === 0) {
    say("claim.track", `names ${claim.track}; these records carry no ranking for it`);
  } else if (own === undefined) {
    say("claim.team", `says team ${claim.team} placed in ${claim.track}; the ranking does not contain it`);
  } else {
    if (own.rank !== claim.rank) {
      say("claim.rank", `says ${claim.rank}; the ranking says ${own.rank}`);
    }
    if (claim.finalScore !== null && own.finalScore !== null && claim.finalScore !== own.finalScore) {
      say("claim.finalScore", `says ${claim.finalScore}; the ranking says ${own.finalScore}`);
    }
  }

  if (claim.finalScore !== null && !revealed(observed.phase)) {
    /* A credential carrying a score for an event that has not revealed is
       carrying something nobody is supposed to have yet — whether it was
       tampered with or issued too early, a reader should not accept it. */
    say("claim.finalScore", "carries a score for an event that has not revealed");
  }

  const paid = observed.payments.find(
    (payment) => payment.track === claim.track && payment.rank === claim.rank && payment.kind === 0,
  );

  if (credential.evidence.payoutTxHash !== null) {
    if (paid === undefined) {
      say("evidence.payoutTxHash", "names a payout; these records carry none for that placing");
    } else if (paid.txHash !== credential.evidence.payoutTxHash) {
      say("evidence.payoutTxHash", `names ${credential.evidence.payoutTxHash}; the ledger says ${paid.txHash}`);
    }
  }

  const submission = observed.submissions.find((entry) => entry.team === claim.team);

  if (
    credential.evidence.submissionDigest !== null &&
    submission !== undefined &&
    submission.digest !== null &&
    submission.digest !== credential.evidence.submissionDigest
  ) {
    say("evidence.submissionDigest", "is not the digest the contract pinned for that team");
  }

  return problems;
}

export function revealed(phase: number | null): boolean {
  return phase !== null && phase >= REVEAL_PHASE;
}

/**
 * Whether the records a reader brought are enough to check this credential.
 *
 * Checked separately from the comparison, because "nothing disagreed" means two
 * very different things depending on whether there was anything to disagree
 * with. A reader who fetched an empty ranking should be told their evidence is
 * thin, not told the credential passed.
 */
export function coverageOf(credential: Credential, observed: ObservedEvent): string[] {
  const notes: string[] = [];

  if (observed.placements.length === 0) {
    notes.push("These records carry no ranking, so no placement claim could be compared against one.");
  }
  if (observed.members.length === 0) {
    notes.push("These records carry no team membership, so the subject's team could not be confirmed.");
  }
  if (observed.payments.length === 0 && credential.evidence.payoutTxHash !== null) {
    notes.push("These records carry no payments, so the payout this credential names could not be confirmed.");
  }
  if (observed.constitutionHash === null) {
    notes.push("These records carry no rules digest, so which competition this was could not be confirmed.");
  }

  return notes;
}
