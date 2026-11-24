"use client";

import { useState } from "react";

import { ReceiptCard } from "./receipt-card";
import { DistributionTrace } from "./distribution-trace";
import { Button } from "../components/primitives";
import type { SponsorContribution } from "./dashboard";

/**
 * One row per contribution, with its receipt a click away.
 *
 * Folded rather than listed open. A sponsor backing twenty positions across
 * four events has twenty receipts, and a page that printed all of them would
 * bury the one question they came with — which is whether anything is still
 * unpaid.
 */

export function ContributionList({
  contract,
  contributions,
}: {
  contract: string;
  contributions: SponsorContribution[];
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ul className="grid gap-3">
      {contributions.map((contribution) => {
        const receipt = contribution.receipt;
        const showing = open === receipt.sponsorshipIndex;

        return (
          <li
            key={receipt.sponsorshipIndex}
            className="rounded-[0.75rem] bg-paper-sunk px-5 py-4 ring-1 ring-inset ring-rule"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div className="min-w-0">
                <p className="text-[1rem]">
                  {receipt.track}
                  {" · "}
                  {receipt.rank === 0 ? "every place" : `place ${receipt.rank}`}
                </p>

                <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
                  {receipt.amount} given · {receipt.fee} fee · {new Date(receipt.at * 1000).toISOString().slice(0, 10)}
                </p>
              </div>

              <Button
                size="sm"
                intent="ghost"
                onClick={() => setOpen(showing ? null : receipt.sponsorshipIndex)}
              >
                {showing ? "Hide receipt" : "Receipt"}
              </Button>
            </div>

            <div className="mt-3">
              <DistributionTrace contribution={contribution} />
            </div>

            {showing && (
              <div className="mt-4">
                <ReceiptCard contract={contract} contribution={contribution} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
