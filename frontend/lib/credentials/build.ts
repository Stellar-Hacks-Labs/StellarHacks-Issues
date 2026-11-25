/**
 * Turning what the records say into claims somebody can hand over.
 *
 * Decision 8 says a builder's profile is derived from records rather than from
 * declarations. This is that derivation, lifted out of the page so it can be
 * signed, exported and checked elsewhere — which is the whole point of the
 * issue: the honest version of a builder's history should not be something only
 * this website can compute.
 *
 * Two rules it will not bend:
 *
 *   a placement is only claimed for an event that has revealed, because before
 *   the reveal the scores are sealed and a credential carrying one would carry
 *   something nobody is supposed to have yet;
 *
 *   nothing is claimed that the records do not contain. A participation claim
 *   for an event somebody joined is not a placement, and the absence of a prize
 *   is not an absence of achievement — it is simply not this credential's to
 *   assert.
 */

/** Phase five is the reveal, in the contract's own numbering. */
export const REVEAL_PHASE = 5;

export type CredentialRole = "builder" | "judge" | "organizer" | "sponsor";

export interface PlacementClaim {
  kind: "placement";
  track: string;
  rank: number;
  team: number;
  finalScore: number | null;
}

export interface ParticipationClaim {
  kind: "participation";
  role: CredentialRole;
  team: number | null;
}

export type CredentialClaim = PlacementClaim | ParticipationClaim;

export interface CredentialEvidence {
  contract: string;
  slug: string | null;
  constitutionHash: string | null;
  payoutTxHash: string | null;
  submissionDigest: string | null;
  scoreRoot: string | null;
}

export interface CredentialPayload {
  version: "stelhacks.credential.v1";
  subject: { address: string; username: string | null };
  claim: CredentialClaim;
  evidence: CredentialEvidence;
  issuer: { keyId: string; signedAt: string };
}

export const CREDENTIAL_VERSION = "stelhacks.credential.v1" as const;

/** What a page read for one event, as `build` takes it. */
export interface EventRecords {
  contract: string;
  slug: string | null;
  phase: number | null;
  constitutionHash: string | null;
  scoreRoot: string | null;
  /** The ranking as published, which is empty before there is one. */
  placements: readonly { track: string; rank: number; team: number; finalScore: number | null }[];
  /** The teams this subject is recorded in. */
  teams: readonly number[];
  submissions: readonly { team: number; digest: string | null }[];
  /** Payments out of the vault, for linking a placing to the transaction that settled it. */
  payments: readonly { track: string; rank: number; kind: number; txHash: string }[];
}

export interface BuildInput {
  subject: { address: string; username: string | null };
  keyId: string;
  now: string;
  events: readonly EventRecords[];
  /** Which role to claim where no placement is found. Defaults to builder. */
  role?: CredentialRole;
}

export function revealed(phase: number | null): boolean {
  return phase !== null && phase >= REVEAL_PHASE;
}

/**
 * Every claim these records support, as payloads ready to sign.
 *
 * One placement claim per track this subject's team placed in, and — when an
 * event yields none — a single participation claim, so taking part is still
 * something somebody can hand over. A ranking that exists but has not been
 * revealed yields participation too: the placing is public, the score is not,
 * and a credential is not the place to split that hair for a reader who will
 * paste it into a form somewhere.
 */
export function build(input: BuildInput): CredentialPayload[] {
  const payloads: CredentialPayload[] = [];
  const subject = { subject: input.subject, keyId: input.keyId, now: input.now };

  for (const event of input.events) {
    const teams = new Set(event.teams);
    const mine = revealed(event.phase)
      ? event.placements.filter((placement) => teams.has(placement.team))
      : [];

    if (mine.length > 0) {
      for (const placement of [...mine].sort((left, right) => left.rank - right.rank)) {
        payloads.push(
          payloadFor(subject, event, {
            kind: "placement",
            track: placement.track,
            rank: placement.rank,
            team: placement.team,
            finalScore: placement.finalScore,
          }),
        );
      }

      continue;
    }

    payloads.push(
      payloadFor(subject, event, {
        kind: "participation",
        role: input.role ?? "builder",
        /* The first team the chain records them in, or null for a judge, an
           organizer or a sponsor, who are not team members at all. */
        team: [...teams].sort((left, right) => left - right)[0] ?? null,
      }),
    );
  }

  return payloads;
}

/** A single payload, from one claim and one event's records. */
export function payloadFor(
  input: Omit<BuildInput, "events" | "role">,
  event: EventRecords,
  claim: CredentialClaim,
): CredentialPayload {
  const team = claim.team;
  const submission = team === null ? undefined : event.submissions.find((entry) => entry.team === team);
  const paid =
    claim.kind === "placement"
      ? event.payments.find(
          (payment) => payment.track === claim.track && payment.rank === claim.rank && payment.kind === 0,
        )
      : undefined;

  return {
    version: CREDENTIAL_VERSION,
    subject: input.subject,
    claim,
    evidence: {
      contract: event.contract,
      slug: event.slug,
      constitutionHash: event.constitutionHash,
      payoutTxHash: paid?.txHash ?? null,
      submissionDigest: submission?.digest ?? null,
      scoreRoot: event.scoreRoot,
    },
    issuer: { keyId: input.keyId, signedAt: new Date(input.now).toISOString() },
  };
}
