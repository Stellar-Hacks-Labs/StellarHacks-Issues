"use client";

import { useState } from "react";

import { Button } from "../../components/primitives";
import { NOTE_LIMIT, RELATIONSHIPS, RELATIONSHIP_WORDS, type Declaration } from "../../../lib/conflicts";
import type { Card } from "../../../lib/project";
import type { Entry } from "../../../lib/submissions";
import { titleOf } from "../../../lib/words";

/**
 * The step before the scoresheets: say which of these teams you are close to.
 *
 * Put first, and in front of the cards rather than beside them, because the
 * order is the argument. A judge who has already read a project and formed a
 * view is being asked a different question than a judge looking at a list of
 * names, and only the second question is the one a declaration can answer
 * honestly.
 *
 * Nothing here is verified and nothing here accuses. The product cannot know
 * who mentored whom; what it can do is make saying so one click, record when it
 * was said, and refuse the card it rules out. Automatic detection is
 * deliberately out of scope — a guess about somebody's relationships, published
 * beside their name, would be worse than the gap it filled.
 */

export function Declare({
  contractId,
  judge,
  entries,
  cards,
  declared,
  onDeclared,
}: {
  contractId: string;
  judge: string | null;
  entries: Entry[];
  cards: Record<number, Card>;
  declared: Declaration[];
  onDeclared: (declaration: Declaration) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [relationship, setRelationship] = useState<string>("mentor");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  const alreadyDeclared = new Set(declared.map((one) => one.team));

  async function declare(team: number) {
    setBusy(true);
    setRefused(null);

    try {
      const answered = await fetch("/api/conflicts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contract: contractId, judge, team, relationship, note }),
      });
      const said = (await answered.json()) as { declaration?: Declaration; error?: string };

      if (!answered.ok || said.declaration === undefined) {
        setRefused(said.error ?? "The declaration was not recorded. Try again.");

        return;
      }

      onDeclared(said.declaration);
      setOpen(null);
      setNote("");
      setRelationship("mentor");
    } catch {
      setRefused("The declaration did not reach us, so nothing was recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="declare-heading">
      <div className="space-y-2">
        <p className="label text-[0.8125rem] tracking-[0.16em] text-ink-faint">Before you score</p>

        <h2 id="declare-heading" className="text-[1.25rem]">
          Declare any team you are close to
        </h2>

        <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          A declaration is recorded with the time you made it and published with the scores at the
          reveal. It sets that project aside: your scorecard for it is refused from this moment,
          and the organizer reassigns it. Nothing here is checked by us, and declaring nothing is a
          statement too.
        </p>
      </div>

      {judge === null && (
        <p className="text-[0.9375rem] text-ink-soft">
          Connect the wallet you were named a judge with to declare anything.
        </p>
      )}

      <ul className="space-y-3">
        {entries.map((entry) => {
          const title = titleOf(cards[entry.team]?.title ?? `Project ${entry.team}`);
          const mine = alreadyDeclared.has(entry.team);

          return (
            <li
              key={entry.team}
              className="rounded-[0.75rem] bg-paper-sunk px-5 py-4 ring-1 ring-inset ring-rule"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[1rem]">{title}</p>
                  <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
                    Project {entry.team}
                  </p>
                </div>

                {mine ? (
                  <p className="text-[0.9375rem] text-ink-soft">Declared</p>
                ) : (
                  <Button
                    size="sm"
                    intent="ghost"
                    disabled={judge === null || busy}
                    onClick={() => setOpen(open === entry.team ? null : entry.team)}
                  >
                    {open === entry.team ? "Cancel" : "I know this team"}
                  </Button>
                )}
              </div>

              {open === entry.team && (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void declare(entry.team);
                  }}
                >
                  <label className="flex flex-col gap-1 text-[0.9375rem]">
                    How you know them
                    <select
                      value={relationship}
                      onChange={(event) => setRelationship(event.target.value)}
                      className="min-h-11 rounded-[0.5rem] bg-paper px-3 ring-1 ring-inset ring-rule"
                    >
                      {RELATIONSHIPS.map((kind) => (
                        <option key={kind} value={kind}>
                          {RELATIONSHIP_WORDS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-[0.9375rem]">
                    Anything the list does not cover
                    <textarea
                      value={note}
                      maxLength={NOTE_LIMIT}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      className="rounded-[0.5rem] bg-paper px-3 py-2 ring-1 ring-inset ring-rule"
                    />
                  </label>

                  <Button size="sm" type="submit" disabled={busy}>
                    {busy ? "Recording" : "Declare this conflict"}
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {refused !== null && (
        <p role="alert" className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-broken">
          {refused}
        </p>
      )}
    </section>
  );
}
