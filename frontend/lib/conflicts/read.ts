import { isRelationship, type Declaration } from "./write";

/**
 * Declarations as they come back from the table, turned into the shape the rest
 * of this feature reasons about.
 *
 * Tolerant in one direction only. A row this version does not understand — a
 * relationship added by a later migration, a team that arrived as text — is
 * dropped from the list rather than guessed at, because every reader of that
 * list either hides a project or publishes a claim about a judge. Dropping a
 * row makes the page show less than the truth; guessing makes it show something
 * that is not.
 *
 * The dropped rows are counted rather than discarded silently, so a page can
 * say that it is not showing everything.
 */

export interface Declarations {
  declarations: Declaration[];
  /** Rows the table returned that this version could not read. */
  unreadable: number;
}

export function fromRows(rows: readonly Record<string, unknown>[]): Declarations {
  const declarations: Declaration[] = [];
  let unreadable = 0;

  for (const row of rows) {
    const contract = row["contract_id"];
    const judge = row["judge"];
    const team = Number(row["team_id"]);
    const relationship = String(row["relationship"] ?? "");
    const declaredAt = row["declared_at"];

    if (
      typeof contract !== "string" ||
      typeof judge !== "string" ||
      !Number.isInteger(team) ||
      team < 1 ||
      !isRelationship(relationship) ||
      typeof declaredAt !== "string" ||
      !Number.isFinite(Date.parse(declaredAt))
    ) {
      unreadable += 1;
      continue;
    }

    declarations.push({
      contract,
      judge,
      team,
      relationship,
      note: typeof row["note"] === "string" ? row["note"] : "",
      declaredAt: new Date(declaredAt).toISOString(),
    });
  }

  return { declarations: ordered(declarations), unreadable };
}

/**
 * Oldest first, then by team.
 *
 * Order matters on the proof page: a reader comparing declarations against
 * scores is asking when each one was made, and a list that arrived in whatever
 * order PostgREST chose invites them to read the first row as the first
 * declaration.
 */
export function ordered(declarations: readonly Declaration[]): Declaration[] {
  return [...declarations].sort(
    (left, right) =>
      left.declaredAt.localeCompare(right.declaredAt) ||
      left.team - right.team ||
      left.judge.localeCompare(right.judge),
  );
}

/** Just this judge's own declarations, for their console. */
export function declarationsBy(judge: string, declarations: readonly Declaration[]): Declaration[] {
  return ordered(declarations.filter((declaration) => declaration.judge === judge));
}

/** The teams a judge has declared, which is all the queue filter needs. */
export function declaredTeams(declarations: readonly Declaration[]): Set<number> {
  return new Set(declarations.map((declaration) => declaration.team));
}
