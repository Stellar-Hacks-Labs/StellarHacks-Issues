"use client";

import { useCallback, useEffect, useState } from "react";

import { ContributionList } from "./contribution-list";
import { EmptyState } from "./empty-state";
import { useWallet } from "../components/wallet-context";
import type { SponsorReceipt, TraceRoute } from "../../lib/sponsors";

/**
 * One sponsor's contributions, across the events they have backed.
 *
 * Read for the connected wallet and for no other. That is not what makes it
 * private — a contribution into a public vault and a payment out of it are both
 * public, and this page says so rather than implying a confidence it cannot
 * keep. What the dashboard is for is the question the public page cannot
 * answer at a glance: of everything *I* gave, what is still unpaid.
 *
 * The events are asked for one at a time because each answer is three contract
 * reads deep, and a sponsor with one event should not wait for somebody else's
 * twelve.
 */

export interface SponsorLeg {
  track: string;
  rank: number | null;
  route: TraceRoute;
  paidOut: string;
  payouts: { recipient: string; amount: string; kind: 0 | 1 | 2; ledger: number; txHash: string }[];
}

export interface SponsorContribution {
  receipt: SponsorReceipt;
  verify: string;
  directed: boolean;
  notes: string[];
  legs: SponsorLeg[];
}

export interface EventSponsorship {
  contract: string;
  name: string;
  slug: string | null;
  payoutsRead: boolean;
  totals: {
    contributions: number;
    given: string;
    fees: string;
    paid: string;
    routes: TraceRoute[];
  };
  contributions: SponsorContribution[];
}

export function Dashboard({ backed }: { backed: { contract: string; name: string; slug: string | null }[] }) {
  const { wallet } = useWallet();
  const address = wallet?.address ?? null;
  const [events, setEvents] = useState<EventSponsorship[] | null>(null);
  const [refused, setRefused] = useState<string | null>(null);

  const read = useCallback(async () => {
    if (address === null) {
      setEvents(null);

      return;
    }

    const found: EventSponsorship[] = [];
    let said: string | null = null;

    for (const event of backed) {
      try {
        const answered = await fetch(
          `/api/sponsor-receipts?contract=${event.contract}&sponsor=${address}`,
        );
        const body = (await answered.json()) as {
          payoutsRead?: boolean;
          sponsors?: Array<{ sponsor: string; totals: EventSponsorship["totals"]; contributions: SponsorContribution[] }>;
          error?: string;
        };

        if (!answered.ok) {
          /* One unreachable event is not a reason to show nothing. The sentence
             is kept and shown beside whatever did arrive. */
          said = body.error ?? "One hackathon could not be read.";
          continue;
        }

        const mine = body.sponsors?.find((one) => one.sponsor === address);

        if (mine === undefined || mine.totals.contributions === 0) {
          continue;
        }

        found.push({
          contract: event.contract,
          name: event.name,
          slug: event.slug,
          payoutsRead: body.payoutsRead ?? false,
          totals: mine.totals,
          contributions: mine.contributions,
        });
      } catch {
        said = "A hackathon could not be read.";
      }
    }

    setEvents(found);
    setRefused(said);
  }, [address, backed]);

  useEffect(() => {
    void read();
  }, [read]);

  if (address === null) {
    return <EmptyState connected={false} />;
  }

  if (events === null) {
    return <p className="label text-ink-faint">Reading the contract</p>;
  }

  if (events.length === 0) {
    return (
      <div className="grid gap-6">
        <EmptyState connected />
        {refused !== null && <p className="text-[0.9375rem] text-ink-faint">{refused}</p>}
      </div>
    );
  }

  const open = events.filter((event) => event.totals.routes.includes("unsettled"));

  return (
    <div className="grid gap-10">
      <p className="max-w-[44rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        {open.length === 0
          ? "Every position you backed has settled."
          : `${open.length} of ${events.length} hackathons you backed still have a position that has not been paid.`}{" "}
        The same figures are on each event&apos;s public sponsor page — a contribution into a public
        vault and a payment out of it are both public, and this page only narrows them to your wallet.
      </p>

      {refused !== null && <p className="text-[0.9375rem] text-ink-faint">{refused}</p>}

      {events.map((event) => (
        <section key={event.contract} className="grid gap-4">
          <div className="grid gap-1">
            <h2 className="text-[1.25rem]">{event.name}</h2>

            <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
              {event.totals.contributions} contribution(s) · {event.totals.given} given ·{" "}
              {event.totals.fees} in fees
            </p>

            {!event.payoutsRead && (
              <p className="text-[0.875rem] text-ink-faint">
                The payment log could not be read for this event, so outcomes are shown as not paid
                yet rather than as nothing.
              </p>
            )}
          </div>

          <ContributionList contract={event.contract} contributions={event.contributions} />
        </section>
      ))}
    </div>
  );
}
