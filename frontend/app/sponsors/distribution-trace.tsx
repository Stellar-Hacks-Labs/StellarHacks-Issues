import { ROUTE_WORDS } from "../../lib/sponsors";
import type { SponsorContribution } from "./dashboard";

/**
 * What happened to the positions one contribution backed.
 *
 * One line per position, each naming its ending and the transaction that
 * produced it. It never says what share of a payout was this sponsor's: a
 * position's payout is its frozen prize plus every contribution to it, and no
 * record separates one back out. The amount shown is the position's whole
 * payout and is labelled as such.
 */

export function DistributionTrace({ contribution }: { contribution: SponsorContribution }) {
  return (
    <div className="grid gap-2">
      {contribution.legs.map((leg) => (
        <div key={`${leg.track}:${leg.rank ?? "track"}`} className="grid gap-1 text-[0.9375rem]">
          <p>
            <span className="text-ink-soft">
              {leg.rank === null ? `${leg.track}, every place` : `${leg.track} place ${leg.rank}`}:{" "}
            </span>
            {ROUTE_WORDS[leg.route]}
          </p>

          {leg.payouts.map((payout) => (
            <p key={payout.txHash} className="text-[0.875rem] text-ink-soft">
              The position paid {payout.amount} to{" "}
              <span className="tabular break-all">{payout.recipient}</span>{" "}
              <a
                href={`https://stellar.expert/explorer/public/tx/${payout.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-ink"
              >
                transaction
              </a>
            </p>
          ))}
        </div>
      ))}

      {contribution.notes.map((note) => (
        <p key={note} className="max-w-[44rem] text-[0.875rem] text-ink-faint">
          {note}
        </p>
      ))}
    </div>
  );
}
