import Link from "next/link";
import { notFound } from "next/navigation";

import { SponsorTable } from "./sponsor-table";
import { Eyebrow, Measure } from "../../../components/primitives";
import { backersOf } from "../../../../lib/backers";
import { findHackathon } from "../../../../lib/chain";
import { rulesFor } from "../../../../lib/rules";
import { contributionsOf, positionsOf } from "../../../../lib/sponsor";
import { indexContributions, payoutsFrom, placesFrom, viewsFor } from "../../../../lib/sponsors";
import { serverClient } from "../../../../lib/supabase/server";

/**
 * This event's sponsors, and what happened to what they gave.
 *
 * A page of its own rather than a section of the event page, for the same
 * reason the proof page is: the question it answers is "show me all of it", and
 * everything else about an event is read by somebody deciding whether to enter.
 *
 * Read with no account and no wallet. A sponsor demonstrating that funds were
 * distributed as announced has to be able to send this link to somebody who has
 * never signed in here.
 */

export const dynamic = "force-dynamic";

export default async function Sponsors({ params }: PageProps<"/hackathons/[slug]/sponsors">) {
  const { slug } = await params;
  const hackathon = await findHackathon(slug);

  if (hackathon === null) {
    notFound();
  }

  const contract = hackathon.contract_id;
  const rules = hackathon.rules ?? (await rulesFor(contract).catch(() => null));

  const [records, positions, backers, db] = await Promise.all([
    contributionsOf(contract).catch(() => null),
    rules === null ? Promise.resolve(null) : positionsOf(contract, rules).catch(() => null),
    backersOf(contract),
    serverClient(),
  ]);

  const { data } = db === null
    ? { data: null }
    : await db
        .from("payments")
        .select("track, rank, recipient, amount, kind, ledger, tx_hash")
        .eq("contract_id", contract);

  const { payouts, unreadable } = payoutsFrom((data ?? []) as Record<string, unknown>[]);
  const views = records === null || positions === null
    ? []
    : viewsFor(indexContributions(records), placesFrom(positions), payouts);

  return (
    <main className="flex-1">
      <Measure className="py-10 sm:py-14">
        <Eyebrow>Sponsors</Eyebrow>

        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] text-balance">{hackathon.name}</h1>

        <p className="mt-4 max-w-[42rem] text-ink-soft">
          Every contribution this event took, read from the contract, beside what the vault paid
          along the position it backed. Follow any transaction to check it against a block explorer.
        </p>

        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
          <Link href={`/hackathons/${slug}`} className="underline underline-offset-4 hover:text-ink">
            Back to the hackathon
          </Link>
          <Link href={`/hackathons/${slug}/proof`} className="underline underline-offset-4 hover:text-ink">
            The whole receipt
          </Link>
        </p>

        <div className="mt-10 grid gap-6">
          {records === null && (
            <p className="text-[0.9375rem] text-ink-faint">
              The contract&apos;s own contribution list could not be read, so nothing is shown here.
              That is this page unable to reach the chain, not an event without sponsors.
            </p>
          )}

          {records !== null && positions === null && (
            <p className="text-[0.9375rem] text-ink-faint">
              The frozen prize table could not be read, so contributions cannot be matched to
              positions.
            </p>
          )}

          {db === null && (
            <p className="text-[0.9375rem] text-ink-faint">
              The payment log could not be read, so every outcome below reads as not paid yet.
            </p>
          )}

          <SponsorTable views={views} backers={backers} />

          {unreadable > 0 && (
            <p className="text-[0.875rem] text-ink-faint">
              {unreadable} payment row{unreadable === 1 ? "" : "s"} could not be read by this version
              of the page and {unreadable === 1 ? "is" : "are"} left out of the outcomes above.
            </p>
          )}
        </div>
      </Measure>
    </main>
  );
}
