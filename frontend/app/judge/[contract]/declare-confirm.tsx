"use client";

import { useState } from "react";

import { Button } from "../../components/primitives";

/**
 * The one thing the judge has to say before the scoresheets appear.
 *
 * A gate rather than a notice, and that is the whole of its design. A page that
 * listed the projects, explained declarations and then showed the sheets
 * underneath would be read in the order a judge scrolls, which is past it. A
 * judge who has nothing to declare spends one click here; a judge who has
 * something to declare has already been asked before they saw a single score.
 *
 * It is not a promise we can check, and it does not claim to be. What it
 * records is that the question was put before the work, which is the part the
 * product can honestly stand behind.
 */

export function DeclareConfirm({
  declared,
  onConfirm,
}: {
  declared: number;
  onConfirm: () => void;
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <section
      className="space-y-4 rounded-[0.75rem] bg-paper-sunk px-5 py-5 ring-1 ring-inset ring-rule"
      aria-labelledby="confirm-heading"
    >
      <h2 id="confirm-heading" className="text-[1rem]">
        {declared === 0
          ? "You have declared no conflicts"
          : declared === 1
            ? "You have declared one conflict"
            : `You have declared ${declared} conflicts`}
      </h2>

      <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
        You can come back and declare one later, and the projects you declared stay out of your
        queue. What you cannot do is remove a declaration: it is published with the scores at the
        reveal.
      </p>

      <label className="flex items-start gap-3 text-[0.9375rem]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1"
        />
        I have read the list of projects and declared every team I am close to.
      </label>

      <Button size="sm" disabled={!agreed} onClick={onConfirm}>
        Start scoring
      </Button>
    </section>
  );
}
