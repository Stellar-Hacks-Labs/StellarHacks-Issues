import { ordered } from "./read";
import type { Declaration } from "./write";

/**
 * What the proof page may show, and when.
 *
 * The declarations are the counterpart to the scores: a reader checking a
 * result wants to know whether the judge who marked a team was close to it.
 * That question only becomes answerable at the reveal, and before then
 * publishing the declarations does harm — it tells a team which judge is left
 * to mark them while the panel is still working.
 *
 * So this is a gate with one input: the phase the indexer recorded. The
 * database enforces the same rule, and that is the one that counts; this exists
 * so the page does not render a section it would then have to apologise for,
 * and so the reason is written down somewhere a reader can see it.
 */

/** Phase five is the reveal, in the contract's own numbering. */
export const REVEAL_PHASE = 5;

export interface Published {
  /** Empty until the reveal. */
  declarations: Declaration[];
  /** Why the list is empty, when it is, in words a visitor can read. */
  withheld: string | null;
}

export function publishable(phase: number | null, declarations: readonly Declaration[]): Published {
  if (phase === null || phase < REVEAL_PHASE) {
    return {
      declarations: [],
      withheld:
        "Declarations are published with the scores at the reveal. Publishing them earlier would tell a team which judges are still marking it.",
    };
  }

  return { declarations: ordered(declarations), withheld: null };
}

/**
 * How many declarations each project collected, for the line under its name.
 *
 * Counted per team rather than per judge because that is the question a team
 * asks about its own result. The judges are named in the list itself; a count
 * beside a project is what makes it worth opening.
 */
export function countsByTeam(declarations: readonly Declaration[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const declaration of declarations) {
    counts.set(declaration.team, (counts.get(declaration.team) ?? 0) + 1);
  }

  return counts;
}

/**
 * The sentence the proof page puts above the list.
 *
 * It says what the list is evidence of and what it is not: a declaration shows
 * a judge said something before the scores opened, and says nothing about
 * whether anybody declared everything they should have.
 */
export function publishedNotice(declarations: readonly Declaration[]): string {
  if (declarations.length === 0) {
    return "No judge declared a conflict with any project at this event.";
  }

  const judges = new Set(declarations.map((declaration) => declaration.judge)).size;
  const subject = declarations.length === 1 ? "declaration" : "declarations";
  const by = judges === 1 ? "judge" : "judges";

  return `${declarations.length} ${subject} from ${judges} ${by}, each recorded before the scores opened. A declaration blocked that judge's scorecard for that project; it is not a check that every conflict was declared.`;
}
