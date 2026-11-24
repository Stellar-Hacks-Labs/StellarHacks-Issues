import { declarationsOf, type DeclarationReader } from "./conflict-store.js";
import { isTeamId } from "./validate.js";

/**
 * The one rule a declaration buys: a judge cannot score a team they declared a
 * conflict with.
 *
 * Enforced here rather than only in the judge's console, because the console is
 * a convenience and this service is the gate. A card that reached this point
 * was signed by the judge's own key and arrived over the network; the page that
 * hid the project from their queue was never in the way.
 *
 * It is deliberately not a verdict about the judge. The refusal says the
 * project is theirs to declare and not theirs to score, and the organizer is
 * the one who reassigns it.
 */

/**
 * What the judge is told, in one place.
 *
 * The console turns this into a sentence a person can act on, and it matches on
 * the wording, so the wording lives next to the rule rather than inline at the
 * route.
 */
export function conflictRefusal(relationship: string): string {
  return `a conflict was declared for this project (${relationship})`;
}

/**
 * Whether this judge declared a conflict with this team, as the relationship
 * they named or `null` for none.
 *
 * The reader is a parameter so the rule can be tested without a database. It
 * defaults to the real table, so a caller that forgets to pass one still asks
 * the question that matters rather than silently asking nothing.
 */
export async function declaredConflict(
  contract: string,
  judge: string,
  team: number,
  read: DeclarationReader = declarationsOf,
): Promise<string | null> {
  if (!isTeamId(team)) {
    return null;
  }

  const declared = await read(contract, judge);
  const found = declared.find((entry) => entry.team === team);

  return found === undefined ? null : found.relationship;
}
