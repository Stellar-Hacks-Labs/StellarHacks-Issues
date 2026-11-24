import { RECEIPT_LIMITS } from "../../lib/sponsors";
import type { SponsorContribution } from "./dashboard";

/**
 * The receipt, and the command that checks it without us.
 *
 * Every figure here is also on the chain, and the block at the bottom is how a
 * sponsor confirms that: it re-derives this receipt from the contract and the
 * payment log with the SDK, and reports anything that disagrees. A receipt
 * printed by the application somebody is being asked to trust is worth exactly
 * as much as the instructions for checking it elsewhere.
 */

export function ReceiptCard({
  contract,
  contribution,
}: {
  contract: string;
  contribution: SponsorContribution;
}) {
  const receipt = contribution.receipt;

  return (
    <section className="grid gap-4 rounded-[0.75rem] bg-paper px-5 py-5 ring-1 ring-inset ring-rule" aria-label="Receipt">
      <h3 className="text-[1rem]">Receipt</h3>

      <dl className="grid gap-2 text-[0.875rem]">
        {[
          ["Hackathon", contract],
          ["Sponsor", receipt.sponsor],
          ["Contribution", `#${receipt.sponsorshipIndex} in the contract's list`],
          ["Track", receipt.track],
          ["Position", receipt.rank === 0 ? "every place in the track" : `place ${receipt.rank}`],
          ["Prize given", receipt.amount],
          ["Platform fee", receipt.fee],
          ["Paid in total", receipt.paid],
          ["Landed at", new Date(receipt.at * 1000).toISOString()],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="tabular break-all">{value}</dd>
          </div>
        ))}

        <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-ink-soft">Payout transactions</dt>
          <dd className="grid gap-1">
            {receipt.payoutTxHashes.length === 0 ? (
              <span className="text-ink-faint">None yet</span>
            ) : (
              receipt.payoutTxHashes.map((hash) => (
                <a
                  key={hash}
                  href={`https://stellar.expert/explorer/public/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tabular break-all underline underline-offset-4 hover:text-ink"
                >
                  {hash}
                </a>
              ))
            )}
          </dd>
        </div>
      </dl>

      <div className="grid gap-2">
        <h4 className="text-[0.9375rem]">Check it yourself</h4>

        <pre className="overflow-x-auto rounded-[0.5rem] bg-paper-sunk px-4 py-3 text-[0.8125rem] leading-relaxed ring-1 ring-inset ring-rule">
          {contribution.verify}
        </pre>
      </div>

      <ul className="grid gap-1 text-[0.8125rem] text-ink-faint">
        {RECEIPT_LIMITS.map((limit) => (
          <li key={limit}>{limit}</li>
        ))}
      </ul>
    </section>
  );
}
