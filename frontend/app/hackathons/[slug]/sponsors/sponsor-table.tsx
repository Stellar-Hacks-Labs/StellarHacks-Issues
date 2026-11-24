import { ROUTE_WORDS, type SponsorView } from "../../../../lib/sponsors";
import { creditFor, nameOf, type Backer } from "../../../../lib/backers";

/**
 * Who backed this event, and what happened to what they gave.
 *
 * The public half of the sponsor receipts. Everything here is already public —
 * a contribution into a public vault, a payment out of it — and putting the two
 * side by side in one table is the whole answer to "were the funds distributed
 * as announced".
 *
 * A name appears only where its owner asked for one and the organizer agreed;
 * everybody else is the address, which is what the chain actually knows.
 */

export function SponsorTable({
  views,
  backers,
}: {
  views: SponsorView[];
  backers: Backer[];
}) {
  if (views.length === 0) {
    return <p className="text-[0.9375rem] text-ink-faint">Nobody has backed a prize position here yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[0.9375rem]">
        <caption className="pb-3 text-left text-[0.875rem] text-ink-soft">
          Contributions read from the contract, outcomes from the payment log. A position&apos;s
          payout is its frozen prize plus every contribution to it, so the outcome column names what
          happened to the position rather than a share of it.
        </caption>

        <thead>
          <tr>
            {["Sponsor", "Contributions", "Given", "Fees", "Outcome"].map((label) => (
              <th key={label} scope="col" className="py-2 pr-6 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {views.map((view) => (
            <tr key={view.sponsor} className="border-t border-rule align-top">
              {/* `nameOf` is the wall's own rule and is reused rather than
                  restated: a name appears only where its owner asked for one
                  and the organizer agreed, and everybody else is the address
                  the chain knows. */}
              <th scope="row" className="max-w-[18rem] break-all py-3 pr-6 font-normal">
                <span className="tabular">{nameOf(creditFor(backers, view.sponsor), view.sponsor)}</span>
              </th>
              <td className="py-3 pr-6 tabular">{view.totals.contributions}</td>
              <td className="py-3 pr-6 tabular">{view.totals.given.toString()}</td>
              <td className="py-3 pr-6 tabular">{view.totals.fees.toString()}</td>
              <td className="py-3 pr-6">
                {view.totals.routes.length === 0
                  ? "Nothing recorded"
                  : view.totals.routes.map((route) => ROUTE_WORDS[route]).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
