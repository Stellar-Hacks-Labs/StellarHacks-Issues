import { phaseName } from "../phase";
import { revealed, withoutScores } from "./visibility";

/**
 * Rows in, public payloads out.
 *
 * Split from the routes so the shaping is a function rather than a side effect
 * of a request: the contract tests feed it recorded rows and check the result
 * against the OpenAPI document, which is the only way the document and the
 * answers can be held together without a live database in the loop.
 *
 * Nothing here reads. A route hands over rows it read with the anonymous key —
 * so row level security has already decided what the rows are — and this turns
 * them into the published shape, dropping every column the API does not
 * promise rather than forwarding what happened to be selected.
 */

export interface HackathonRow {
  contract_id: unknown;
  slug: unknown;
  name: unknown;
  tagline?: unknown;
  description?: unknown;
  logo_url?: unknown;
  website_url?: unknown;
  phase?: unknown;
  visibility?: unknown;
  organizer?: unknown;
  constitution_hash?: unknown;
  prize_asset?: unknown;
  vault_id?: unknown;
  teams?: unknown;
  submissions?: unknown;
}

const text = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null);
const whole = (value: unknown): number | null => {
  const asked = Number(value);

  return Number.isInteger(asked) ? asked : null;
};
/** `bytea` arrives as `\x…`, which is not a digest until the prefix is gone. */
const hex = (value: unknown): string | null => {
  const written = text(value);

  if (written === null) {
    return null;
  }

  const bare = written.replace(/^\\x/, "").toLowerCase();

  return /^[0-9a-f]+$/.test(bare) ? bare : null;
};

export function hackathonSummary(row: HackathonRow) {
  const phase = whole(row.phase) ?? 0;

  return {
    contract: String(row.contract_id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: text(row.tagline),
    phase,
    phaseName: phaseName(phase),
    visibility: whole(row.visibility) ?? 0,
    logoUrl: text(row.logo_url),
  };
}

export function hackathon(row: HackathonRow) {
  return {
    ...hackathonSummary(row),
    description: text(row.description),
    websiteUrl: text(row.website_url),
    organizer: text(row.organizer),
    constitutionHash: hex(row.constitution_hash),
    prizeAsset: text(row.prize_asset),
    vault: text(row.vault_id),
    teams: whole(row.teams),
    submissions: whole(row.submissions),
  };
}

export interface ProjectRow {
  team_id: unknown;
  title: unknown;
  summary?: unknown;
  repository_url?: unknown;
  demo_video_url?: unknown;
  live_url?: unknown;
  track?: unknown;
  digest?: unknown;
  submitted_at_ledger?: unknown;
  invalid?: unknown;
}

export function project(row: ProjectRow) {
  return {
    team: whole(row.team_id) ?? 0,
    title: String(row.title ?? ""),
    summary: text(row.summary),
    repositoryUrl: text(row.repository_url),
    demoVideoUrl: text(row.demo_video_url),
    liveUrl: text(row.live_url),
    track: text(row.track),
    submissionDigest: hex(row.digest),
    submittedAtLedger: whole(row.submitted_at_ledger),
    disqualified: row.invalid === true,
  };
}

export interface ResultRow {
  track: unknown;
  rank: unknown;
  team_id: unknown;
  final_score?: unknown;
  judge_average?: unknown;
  community?: unknown;
  decided_by?: unknown;
}

export interface PaymentRow {
  track: unknown;
  rank: unknown;
  recipient: unknown;
  amount: unknown;
  kind: unknown;
  ledger: unknown;
  tx_hash: unknown;
}

/**
 * The ranking, by track, with the payment that settled each placing.
 *
 * Scores are nulled while the event has not revealed. The placing is not
 * withheld — the contract ranked publicly — but the numbers behind it are
 * sealed until the reveal, and `revealed: false` beside them says which case a
 * reader is looking at rather than leaving a zero to be misread as a score.
 */
export function results(phase: number | null, rows: readonly ResultRow[], payments: readonly PaymentRow[]) {
  const open = revealed(phase);
  const tracks = [...new Set(rows.map((row) => String(row.track)))].sort();

  return tracks.map((track) => ({
    track,
    revealed: open,
    placements: rows
      .filter((row) => String(row.track) === track)
      .sort((left, right) => (whole(left.rank) ?? 0) - (whole(right.rank) ?? 0))
      .map((row) => {
        const rank = whole(row.rank) ?? 0;
        const paid = payments.find(
          (payment) => String(payment.track) === track && whole(payment.rank) === rank && whole(payment.kind) === 0,
        );
        const placement = {
          rank,
          team: whole(row.team_id) ?? 0,
          finalScore: whole(row.final_score),
          judgeAverage: whole(row.judge_average),
          community: whole(row.community),
          decidedBy: whole(row.decided_by),
          paidAmount: paid === undefined ? null : String(paid.amount),
          paidTxHash: paid === undefined ? null : hex(paid.tx_hash),
        };

        return open ? placement : withoutScores(placement);
      }),
  }));
}

export interface ProofSources {
  contract: string;
  phase: number | null;
  constitutionHash: unknown;
  scoreRoot: unknown;
  ballotRoot: unknown;
  vault: unknown;
  prizeAsset: unknown;
  payments: readonly PaymentRow[];
}

export function proof(sources: ProofSources) {
  return {
    contract: sources.contract,
    phase: sources.phase ?? 0,
    revealed: revealed(sources.phase),
    constitutionHash: hex(sources.constitutionHash),
    scoreRoot: hex(sources.scoreRoot),
    ballotRoot: hex(sources.ballotRoot),
    vault: text(sources.vault),
    prizeAsset: text(sources.prizeAsset),
    payments: sources.payments.map((payment) => ({
      track: String(payment.track),
      rank: whole(payment.rank) ?? 0,
      recipient: String(payment.recipient),
      amount: String(payment.amount),
      kind: (whole(payment.kind) ?? 0) as 0 | 1 | 2,
      ledger: whole(payment.ledger) ?? 0,
      txHash: hex(payment.tx_hash) ?? "",
    })),
  };
}
