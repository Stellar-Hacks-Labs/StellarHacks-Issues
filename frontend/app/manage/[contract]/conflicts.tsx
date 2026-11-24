"use client";

import { useEffect, useState } from "react";

import { RELATIONSHIP_WORDS, fromRows, type Declaration } from "../../../lib/conflicts";

/**
 * Every conflict the panel declared, for the one person who has to act on it.
 *
 * The organizer is the only party who can do anything about a declaration:
 * a declared project leaves that judge's queue and still needs its scorecards,
 * so somebody has to notice and ask another judge. That is why this view exists
 * during judging rather than waiting for the reveal, and why it is grouped by
 * project rather than by judge — "this project is one card short" is the
 * question, and "this judge declared three" is not.
 *
 * It states and does not decide. There is no button here to overrule a
 * declaration or to remove one: the sealer refuses that judge's card whatever
 * this page thinks, and an organizer able to clear a declaration would be an
 * organizer able to clear the record of it.
 */

export function Conflicts({ contractId, judges }: { contractId: string; judges: number }) {
  const [declared, setDeclared] = useState<Declaration[] | null>(null);
  const [unreadable, setUnreadable] = useState(0);
  const [refused, setRefused] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    void (async () => {
      try {
        const answered = await fetch(`/api/conflicts?contract=${contractId}`);
        const said = (await answered.json()) as {
          declarations?: Record<string, unknown>[];
          error?: string;
        };

        if (!live) {
          return;
        }
        if (!answered.ok) {
          setRefused(said.error ?? "The declarations could not be read.");
          setDeclared([]);

          return;
        }

        const read = fromRows(said.declarations ?? []);

        setDeclared(read.declarations);
        setUnreadable(read.unreadable);
      } catch {
        if (live) {
          setRefused("The declarations could not be read.");
          setDeclared([]);
        }
      }
    })();

    return () => {
      live = false;
    };
  }, [contractId]);

  if (declared === null) {
    return <p className="label text-ink-faint">Reading the declarations</p>;
  }

  const byTeam = new Map<number, Declaration[]>();

  for (const declaration of declared) {
    byTeam.set(declaration.team, [...(byTeam.get(declaration.team) ?? []), declaration]);
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-[1.25rem]">Declared conflicts</h2>

        <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Each declaration took that project out of that judge&apos;s queue and blocks their
          scorecard for it. Projects below are a judge short unless another judge covers them;
          declarations are published with the scores at the reveal.
        </p>
      </div>

      {refused !== null && (
        <p role="alert" className="text-[0.9375rem] text-broken">
          {refused}
        </p>
      )}

      {byTeam.size === 0 ? (
        <p className="text-[0.9375rem] text-ink-faint">
          No judge has declared a conflict with any project here.
        </p>
      ) : (
        <ul className="space-y-3">
          {[...byTeam.entries()]
            .sort((left, right) => left[0] - right[0])
            .map(([team, declarations]) => (
              <li
                key={team}
                className="rounded-[0.75rem] bg-paper-sunk px-5 py-4 ring-1 ring-inset ring-rule"
              >
                <p className="text-[1rem]">Project {team}</p>

                <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
                  {declarations.length} of {judges} judges declared
                </p>

                <ul className="mt-3 space-y-2 text-[0.9375rem]">
                  {declarations.map((declaration) => (
                    <li key={declaration.judge}>
                      <p className="tabular break-all text-ink-soft">{declaration.judge}</p>
                      <p className="text-ink-soft">
                        {RELATIONSHIP_WORDS[declaration.relationship]}
                        {declaration.note.length > 0 && <> — {declaration.note}</>}
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      )}

      {unreadable > 0 && (
        <p className="text-[0.9375rem] text-ink-faint">
          {unreadable} {unreadable === 1 ? "declaration" : "declarations"} could not be read by this
          version of the page.
        </p>
      )}
    </section>
  );
}
