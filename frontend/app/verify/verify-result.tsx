import type { CredentialRole } from "../../lib/credentials";

/**
 * What a reader is told about a credential they pasted.
 *
 * Two answers, kept apart on purpose, because they establish different things:
 *
 *   the signature says this platform assembled this exact credential and
 *   nothing in it has changed since;
 *
 *   the evidence links say whether the claim is true, and checking them needs
 *   nobody's permission and nothing from us.
 *
 * A page that collapsed the two into one green tick would be teaching readers
 * to accept "we signed it" as "it is true", which is the reading this whole
 * format exists to prevent.
 */

export interface VerifyOutcome {
  ok: boolean;
  /** Null when the paste was not a credential at all. */
  id: string | null;
  format: { field: string; says: string }[];
  signature: { valid: boolean; says: string; keyId: string } | null;
  /** Whether the key id is the one this deployment publishes. */
  issuedByUs: boolean | null;
  claim:
    | { kind: "placement"; track: string; rank: number; team: number; finalScore: number | null }
    | { kind: "participation"; role: CredentialRole; team: number | null }
    | null;
  evidence: {
    contract: string;
    slug: string | null;
    constitutionHash: string | null;
    payoutTxHash: string | null;
    submissionDigest: string | null;
    scoreRoot: string | null;
  } | null;
  subject: { address: string; username: string | null } | null;
}

export function VerifyResult({ outcome }: { outcome: VerifyOutcome }) {
  if (outcome.format.length > 0) {
    return (
      <section className="space-y-3" aria-labelledby="verify-outcome">
        <h2 id="verify-outcome" className="text-[1.25rem]">
          That is not a credential
        </h2>

        <ul className="space-y-1 text-[0.9375rem] text-ink-soft">
          {outcome.format.map((problem) => (
            <li key={problem.field}>
              <span className="tabular">{problem.field}</span> {problem.says}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="verify-outcome">
      <div className="space-y-2">
        <h2 id="verify-outcome" className="text-[1.25rem]">
          {outcome.signature?.valid === true
            ? "Signed by this platform, unaltered"
            : "This signature does not cover this credential"}
        </h2>

        <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          {outcome.signature?.says}
        </p>

        {outcome.signature !== null && (
          <p className="text-[0.9375rem] text-ink-soft">
            Key id <span className="tabular break-all">{outcome.signature.keyId}</span>{" "}
            {outcome.issuedByUs === true
              ? "— the key this deployment publishes."
              : outcome.issuedByUs === false
                ? "— not the key this deployment publishes, so this was signed by somebody else."
                : "— this deployment publishes no key id, so there is nothing to compare it against."}
          </p>
        )}

        {outcome.id !== null && (
          <p className="tabular break-all text-[0.8125rem] text-ink-faint">{outcome.id}</p>
        )}
      </div>

      {outcome.claim !== null && outcome.subject !== null && (
        <div className="space-y-2">
          <h3 className="text-[1rem]">What it claims</h3>

          <p className="text-[0.9375rem]">
            {outcome.claim.kind === "placement"
              ? `Place ${outcome.claim.rank} in ${outcome.claim.track}, for team ${outcome.claim.team}`
              : `Took part as ${outcome.claim.role}${outcome.claim.team === null ? "" : `, in team ${outcome.claim.team}`}`}
            {outcome.claim.kind === "placement" && outcome.claim.finalScore !== null && (
              <> · score {outcome.claim.finalScore}</>
            )}
          </p>

          <p className="tabular break-all text-[0.875rem] text-ink-soft">
            {outcome.subject.address}
            {outcome.subject.username !== null && <> · @{outcome.subject.username}</>}
          </p>
        </div>
      )}

      {outcome.evidence !== null && (
        <div className="space-y-3">
          <h3 className="text-[1rem]">Check the claim yourself</h3>

          <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
            The signature above only says we assembled this. These are the links that make the claim
            checkable without us — open the contract, compare the rules digest, and follow the
            payout.
          </p>

          <dl className="space-y-2 text-[0.875rem]">
            {[
              ["Hackathon contract", outcome.evidence.contract, `https://stellar.expert/explorer/public/contract/${outcome.evidence.contract}`],
              ["Rules digest", outcome.evidence.constitutionHash, null],
              ["Payout transaction", outcome.evidence.payoutTxHash, outcome.evidence.payoutTxHash === null ? null : `https://stellar.expert/explorer/public/tx/${outcome.evidence.payoutTxHash}`],
              ["Submission digest", outcome.evidence.submissionDigest, null],
              ["Scorecard root", outcome.evidence.scoreRoot, null],
              ["This platform's page", outcome.evidence.slug, outcome.evidence.slug === null ? null : `/hackathons/${outcome.evidence.slug}/proof`],
            ].map(([label, value, href]) => (
              <div key={String(label)} className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
                <dt className="text-ink-soft">{label}</dt>
                <dd className="tabular break-all">
                  {value === null || value === undefined ? (
                    <span className="text-ink-faint">not cited</span>
                  ) : href === null ? (
                    String(value)
                  ) : (
                    <a
                      href={String(href)}
                      target={String(href).startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      {String(value)}
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <p className="max-w-[46rem] text-[0.875rem] text-ink-faint">
            For the full comparison against the chain — the ranking, the team and the payment, field
            by field — run the SDK:{" "}
            <span className="tabular">npx vite-node examples/verify-credential.ts credential.json</span>
          </p>
        </div>
      )}
    </section>
  );
}
