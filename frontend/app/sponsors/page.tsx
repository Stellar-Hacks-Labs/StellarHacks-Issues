import { Dashboard } from "./dashboard";
import { Measure } from "../components/primitives";
import { listHackathons } from "../../lib/chain";

/**
 * The sponsor's own page: what they gave, and where it went.
 *
 * Problem P7 in the README is that a sponsor cannot demonstrate funds were
 * distributed as announced. The contributions and the payouts were both
 * recorded; nothing joined them, so a sponsor asking the question had to be
 * told rather than shown.
 *
 * The event list is read here and the figures in the browser, for a reason
 * worth stating: the figures come from the contract and the payment log per
 * event, and a server rendering twelve events would hold the page until the
 * slowest contract read finished. The list is cheap, so it is server rendered
 * and the rest fills in.
 *
 * Which events to ask about is every event this product knows of rather than a
 * table of "who sponsored what". A sponsor's contributions are the contract's
 * to list, and a table of ours would be a second answer that could be wrong.
 */

export const dynamic = "force-dynamic";

export default async function Sponsors() {
  const hackathons = await listHackathons();

  return (
    <main className="flex-1">
      <Measure className="py-10 sm:py-14">
        <p className="label text-[0.8125rem] tracking-[0.16em] text-ink-faint">Sponsorship</p>

        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)]">Your contributions</h1>

        <p className="mt-4 max-w-[42rem] text-ink-soft">
          Every prize position you have backed, the receipt for each contribution, and what the
          vault eventually paid along that position. All of it read from the contract and the
          payment log, with the command to check it yourself on every receipt.
        </p>

        <div className="mt-10">
          <Dashboard
            backed={hackathons.map((hackathon) => ({
              contract: hackathon.contract_id,
              name: hackathon.name,
              slug: hackathon.slug ?? null,
            }))}
          />
        </div>
      </Measure>
    </main>
  );
}
