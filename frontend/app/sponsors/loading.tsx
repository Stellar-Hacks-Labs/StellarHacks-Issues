import { Measure } from "../components/primitives";

/**
 * The frame, while the contract is read.
 *
 * A sponsor dashboard waits on three sources — the contribution list, the prize
 * positions and the payment log — and the slowest is a contract read per
 * position. The heading stays put so the page does not jump when they land.
 */

export default function Loading() {
  return (
    <main className="flex-1">
      <Measure className="py-10 sm:py-14">
        <p className="label text-[0.8125rem] tracking-[0.16em] text-ink-faint">Sponsorship</p>

        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)]">Your contributions</h1>

        <p className="mt-6 label text-ink-faint">Reading the contract</p>
      </Measure>
    </main>
  );
}
