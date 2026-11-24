import { RELATIONSHIP_WORDS, type Declaration } from "../../../lib/conflicts";
import type { Card } from "../../../lib/project";
import { titleOf } from "../../../lib/words";

/**
 * What this judge has already declared, kept visible while they score.
 *
 * Visible rather than tucked behind the step that collected it. A judge who
 * declared a conflict and then finds a project missing from their queue should
 * be able to see, without leaving the page, that the two facts are the same
 * fact.
 */

export function ConflictList({
  declared,
  cards,
}: {
  declared: Declaration[];
  cards: Record<number, Card>;
}) {
  if (declared.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="declared-heading">
      <h2 id="declared-heading" className="text-[1rem]">
        Set aside by your own declarations
      </h2>

      <ul className="space-y-2">
        {declared.map((declaration) => (
          <li
            key={declaration.team}
            className="rounded-[0.75rem] bg-paper-sunk px-5 py-3 text-[0.9375rem] ring-1 ring-inset ring-rule"
          >
            <p className="truncate">
              {titleOf(cards[declaration.team]?.title ?? `Project ${declaration.team}`)}
            </p>

            <p className="text-ink-soft">
              {RELATIONSHIP_WORDS[declaration.relationship]}
              {declaration.note.length > 0 && <> — {declaration.note}</>}
            </p>

            <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
              Declared {new Date(declaration.declaredAt).toISOString().replace("T", " ").slice(0, 16)} UTC
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
