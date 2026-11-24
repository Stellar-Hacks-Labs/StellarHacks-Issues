import { countsByTeam, publishable, publishedNotice, type Declaration } from "../../../../lib/conflicts";
import { RELATIONSHIP_WORDS } from "../../../../lib/conflicts";
import type { Card } from "../../../../lib/project";
import { titleOf } from "../../../../lib/words";

/**
 * The declarations, beside the scores they bound.
 *
 * This is the half of the conflict policy that faces the public. A judge
 * declaring a conflict is only worth anything if somebody can later read what
 * was declared, when, and against which project — otherwise the product is
 * asking participants to take our word that the panel policed itself.
 *
 * It appears from the reveal and not before. Before the reveal the scores are
 * sealed and the panel is still working, and a list of who declared what would
 * tell a team which judges are left to mark them.
 *
 * What it does not claim: that every conflict was declared. Nobody can know
 * that. It says these were declared before the scores opened, and that each one
 * refused that judge's card for that project.
 */

export function Conflicts({
  phase,
  declarations,
  cards,
  unreadable,
}: {
  phase: number | null;
  declarations: Declaration[];
  cards: Record<number, Card>;
  unreadable: number;
}) {
  const published = publishable(phase, declarations);

  if (published.withheld !== null) {
    return <p className="text-[0.9375rem] text-ink-faint">{published.withheld}</p>;
  }

  const counts = countsByTeam(published.declarations);

  return (
    <div className="grid gap-5">
      <p className="max-w-[40rem] text-[0.875rem] text-ink-soft">
        {publishedNotice(published.declarations)}
      </p>

      {published.declarations.length > 0 && (
        <ul className="grid gap-3">
          {published.declarations.map((declaration) => (
            <li key={`${declaration.judge}:${declaration.team}`} className="grid gap-1">
              <p className="text-[0.875rem] font-medium">
                {titleOf(cards[declaration.team]?.title ?? `Project ${declaration.team}`)}
                {(counts.get(declaration.team) ?? 0) > 1 && (
                  <span className="text-ink-faint"> · {counts.get(declaration.team)} declarations</span>
                )}
              </p>

              <p className="tabular break-all text-[0.875rem] text-ink-soft">{declaration.judge}</p>

              <p className="text-[0.875rem] text-ink-soft">
                {RELATIONSHIP_WORDS[declaration.relationship]}
                {declaration.note.length > 0 && <> — {declaration.note}</>}
              </p>

              <p className="label text-[0.75rem] tracking-[0.14em] text-ink-faint">
                Declared {new Date(declaration.declaredAt).toISOString().replace("T", " ").slice(0, 16)} UTC
              </p>
            </li>
          ))}
        </ul>
      )}

      {unreadable > 0 && (
        <p className="text-[0.875rem] text-ink-faint">
          {unreadable} further {unreadable === 1 ? "declaration" : "declarations"} could not be read
          by this version of the page and {unreadable === 1 ? "is" : "are"} not shown.
        </p>
      )}
    </div>
  );
}
