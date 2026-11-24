import type { Declaration } from "./write";
import { declaredTeams } from "./read";

/**
 * A judge's queue, with the projects they declared a conflict with taken out.
 *
 * Hidden rather than shown and disabled. A disabled scoresheet for a project a
 * judge has declared is an invitation to wonder whether the declaration
 * registered, and the sealer refuses the card either way, so the page has
 * nothing to gain by keeping the row.
 *
 * What it does keep is the count. A queue that quietly went from twelve
 * projects to eleven is a page that lost something; a queue that says one
 * project is set aside is a page that explains itself. The judge can list them
 * at any time, which is what `conflict-list` is for.
 */

export interface Queue<Entry> {
  scoreable: Entry[];
  /** The entries set aside, in the queue's own order. */
  setAside: Entry[];
}

export function withoutConflicts<Entry extends { team: number }>(
  entries: readonly Entry[],
  declarations: readonly Declaration[],
): Queue<Entry> {
  const declared = declaredTeams(declarations);

  return {
    scoreable: entries.filter((entry) => !declared.has(entry.team)),
    setAside: entries.filter((entry) => declared.has(entry.team)),
  };
}

export function isConflicted(declarations: readonly Declaration[], team: number): boolean {
  return declaredTeams(declarations).has(team);
}

/**
 * What the judge is told above their queue.
 *
 * Said in whole projects rather than as a percentage, and said only when there
 * is something to say: a judge with no declarations should not read a sentence
 * about conflicts every time they open the page.
 */
export function queueNotice(queue: Queue<unknown>): string | null {
  if (queue.setAside.length === 0) {
    return null;
  }

  const one = queue.setAside.length === 1;

  return one
    ? "1 project you declared a conflict with is set aside. The organizer reassigns it."
    : `${queue.setAside.length} projects you declared a conflict with are set aside. The organizer reassigns them.`;
}
