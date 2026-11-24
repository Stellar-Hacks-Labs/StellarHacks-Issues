import { NextResponse } from "next/server";

import { rulesFor } from "../../../lib/rules";
import { contributionsOf, positionsOf } from "../../../lib/sponsor";
import {
  indexContributions,
  payoutsFrom,
  placesFrom,
  receiptOf,
  verificationCommand,
  viewFor,
  viewsFor,
} from "../../../lib/sponsors";
import { serverClient } from "../../../lib/supabase/server";

/**
 * What one event's sponsors gave, and where it went.
 *
 * Three sources, each read where it is actually true: the contributions and the
 * prize positions from the contract, the payments from the indexed ledger log.
 * Nothing here is read from a table that holds our opinion of any of it.
 *
 * `sponsor` narrows the answer to one address, which is what the private
 * dashboard asks for. It is **not** an authorization: every number here is
 * already public — a contribution into a public vault and a payment out of it —
 * and a route that pretended otherwise would be claiming privacy it cannot
 * provide. What makes the dashboard private is that it only ever asks about the
 * connected wallet, and the page says plainly that the same figures are on the
 * event's public sponsor page.
 */

export const dynamic = "force-dynamic";

const CONTRACT = /^C[A-Z2-7]{55}$/;
const ADDRESS = /^G[A-Z2-7]{55}$/;

export async function GET(request: Request) {
  const asked = new URL(request.url).searchParams;
  const contract = asked.get("contract") ?? "";
  const sponsor = asked.get("sponsor");

  if (!CONTRACT.test(contract)) {
    return NextResponse.json({ error: "that is not a hackathon address" }, { status: 400 });
  }
  if (sponsor !== null && !ADDRESS.test(sponsor)) {
    return NextResponse.json({ error: "that is not a sponsor address" }, { status: 400 });
  }

  const rules = await rulesFor(contract).catch(() => null);

  if (rules === null) {
    /* The rules are the frozen prize table. Without them the positions are
       unknown, and a trace with no positions could only report a track total —
       which is not what was asked for. Said as unreachable rather than empty:
       this hackathon may be perfectly fine and the chain merely out of reach. */
    return NextResponse.json(
      { error: "the hackathon's frozen rules could not be read, so its prize positions are unknown" },
      { status: 503 },
    );
  }

  const [records, positions] = await Promise.all([
    contributionsOf(contract).catch(() => null),
    positionsOf(contract, rules).catch(() => null),
  ]);

  if (records === null || positions === null) {
    return NextResponse.json(
      { error: "the contract's own contribution list could not be read" },
      { status: 503 },
    );
  }

  const db = await serverClient();
  const { data } = db === null
    ? { data: null }
    : await db
        .from("payments")
        .select("track, rank, recipient, amount, kind, ledger, tx_hash")
        .eq("contract_id", contract);

  const { payouts, unreadable } = payoutsFrom((data ?? []) as Record<string, unknown>[]);
  const indexed = indexContributions(records);
  const places = placesFrom(positions);

  const views = sponsor === null
    ? viewsFor(indexed, places, payouts)
    : [viewFor(sponsor, indexed, places, payouts)];

  return NextResponse.json(
    {
      contract,
      /* Said rather than implied. A dashboard that silently showed no payouts
         because the log was unreachable would be a dashboard quietly telling a
         sponsor their money went nowhere. */
      payoutsRead: db !== null,
      unreadablePayouts: unreadable,
      sponsors: views.map((view) => ({
        sponsor: view.sponsor,
        totals: {
          contributions: view.totals.contributions,
          given: view.totals.given.toString(),
          fees: view.totals.fees.toString(),
          paid: view.totals.paid.toString(),
          paidOut: view.totals.paidOut.toString(),
          routes: view.totals.routes,
        },
        contributions: view.traces.map((trace) => {
          const receipt = receiptOf(contract, trace);

          return {
            receipt,
            verify: verificationCommand(receipt),
            directed: trace.directed,
            notes: trace.notes,
            legs: trace.legs.map((leg) => ({
              track: leg.track,
              rank: leg.rank,
              route: leg.route,
              paidOut: leg.paidOut.toString(),
              payouts: leg.payouts.map((payout) => ({
                recipient: payout.recipient,
                amount: payout.amount.toString(),
                kind: payout.kind,
                ledger: payout.ledger,
                txHash: payout.txHash,
              })),
            })),
          };
        }),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
