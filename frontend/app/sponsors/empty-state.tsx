import Link from "next/link";

/**
 * What a sponsor sees before they have backed anything.
 *
 * Not a shrug. Somebody reading this page is asking whether their money is
 * tracked, and the answer is that there is nothing to track yet — so it says
 * where contributions are made and what will appear here afterwards, rather
 * than printing "no results" at somebody who may have arrived expecting some.
 */

export function EmptyState({ connected }: { connected: boolean }) {
  return (
    <div className="grid gap-3">
      <h2 className="text-[1.25rem]">
        {connected ? "No contributions from this wallet yet" : "Connect the wallet you sponsor with"}
      </h2>

      <p className="max-w-[40rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        {connected
          ? "Back a prize position on any hackathon and it appears here with a receipt, the transaction that funded it, and what the vault eventually paid along that position."
          : "This page reads the contributions made by one address. Connect that wallet and every contribution it has made will be listed with its receipt and its outcome."}
      </p>

      <p className="text-[0.9375rem]">
        <Link href="/hackathons" className="underline underline-offset-4 hover:text-ink">
          Find a hackathon to back
        </Link>
      </p>
    </div>
  );
}
