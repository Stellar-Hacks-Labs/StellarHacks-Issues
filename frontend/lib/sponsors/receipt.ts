import type { SponsorshipTrace, TraceRoute } from "./trace";

/**
 * A receipt, and the command that checks it without us.
 *
 * A receipt printed by the application a sponsor is being asked to trust is
 * worth exactly as much as the instructions for checking it elsewhere. So every
 * receipt carries three things: the figures, the transactions they rest on, and
 * the command that re-derives both from the contract and the payment log.
 *
 * It is not an invoice. No tax identity, no legal entity, no VAT line — the
 * issue says invoicing is out of scope and this stays a statement of what the
 * chain recorded.
 */

export interface ReceiptLine {
  label: string;
  value: string;
  /** Set when the value is a transaction a reader can open. */
  txHash?: string;
}

/** A receipt, in the shape the SDK's own `checkReceipt` takes. */
export interface SponsorReceipt {
  contract: string;
  sponsorshipIndex: number;
  sponsor: string;
  track: string;
  rank: number;
  amount: string;
  fee: string;
  paid: string;
  at: number;
  payoutTxHashes: string[];
  routes: TraceRoute[];
}

export function receiptOf(contract: string, trace: SponsorshipTrace): SponsorReceipt {
  return {
    contract,
    sponsorshipIndex: trace.contribution.index,
    sponsor: trace.contribution.sponsor,
    track: trace.contribution.track,
    rank: trace.contribution.rank,
    amount: trace.contribution.amount.toString(),
    fee: trace.contribution.fee.toString(),
    paid: trace.paid.toString(),
    at: trace.contribution.at,
    /* Sorted and deduplicated, because this list is what the SDK compares
       against the payouts it reaches: an order that depended on the page's read
       would make a correct receipt look edited. */
    payoutTxHashes: [
      ...new Set(trace.legs.flatMap((leg) => leg.payouts.map((payout) => payout.txHash))),
    ].sort(),
    routes: trace.routes,
  };
}

/**
 * The receipt as lines, in the order a person reads them: what was given, what
 * it was aimed at, what happened, and what proves it.
 */
export function receiptLines(receipt: SponsorReceipt, trace: SponsorshipTrace): ReceiptLine[] {
  const lines: ReceiptLine[] = [
    { label: "Hackathon", value: receipt.contract },
    { label: "Sponsor", value: receipt.sponsor },
    { label: "Contribution", value: `#${receipt.sponsorshipIndex} in the contract's list` },
    { label: "Track", value: receipt.track },
    {
      label: "Position",
      value: receipt.rank === 0 ? "every place in the track" : `place ${receipt.rank}`,
    },
    { label: "Prize given", value: receipt.amount },
    { label: "Platform fee", value: receipt.fee },
    { label: "Paid in total", value: receipt.paid },
    { label: "Landed at", value: new Date(receipt.at * 1000).toISOString() },
  ];

  for (const leg of trace.legs) {
    const place = leg.rank === null ? "the whole track" : `place ${leg.rank}`;

    lines.push({ label: `Outcome, ${place}`, value: outcome(leg.route) });

    for (const payout of leg.payouts) {
      lines.push({
        label: `Paid out, ${place}`,
        value: `${payout.amount.toString()} to ${payout.recipient} at ledger ${payout.ledger}`,
        txHash: payout.txHash,
      });
    }
  }

  return lines;
}

function outcome(route: TraceRoute): string {
  switch (route) {
    case "paid":
      return "paid to a winner";
    case "swept":
      return "swept back after the claim period expired";
    case "returned":
      return "returned because the track made no award";
    default:
      return "not paid yet";
  }
}

/**
 * How to check this receipt without opening our site again.
 *
 * Printed on the receipt itself rather than linked, because the point is that
 * it still works when this page does not. It names the SDK's own function, so
 * the check is the same rule the trace used and not a second description of it.
 */
export function verificationCommand(receipt: SponsorReceipt): string {
  return [
    "npm install @stelhacks/sdk",
    "",
    'import { traceSponsorship, checkReceipt } from "@stelhacks/sdk";',
    "",
    `// record: sponsorship(${receipt.sponsorshipIndex}) read from ${receipt.contract}`,
    "// places: the track's prize positions, each worth its frozen amount plus its bonuses",
    "// payouts: the vault's payments for that track, from the ledger",
    "const trace = traceSponsorship(record, places, payouts);",
    "const problems = checkReceipt(receipt, { record, trace });",
    "// an empty list means this receipt agrees with the chain's own records",
  ].join("\n");
}

/** What a sponsor should be told a receipt does not prove. */
export const RECEIPT_LIMITS = [
  "A position's payout is its frozen prize plus every contribution to it. No record separates one sponsor's share back out, so a receipt names the position's outcome rather than claiming a share of it.",
  "A contribution spread over a whole track was divided when it landed, and the contract did not record the split, so such a receipt lists the track's positions instead of a share per position.",
  "A receipt is a statement of what the chain recorded. It is not an invoice and carries no tax or legal identity.",
];
