import { createClient } from "@supabase/supabase-js";

import { settings } from "./config.js";

/**
 * The declarations table, read by the one role that can see it during judging.
 *
 * Before the reveal a declaration is readable by the judge who wrote it and by
 * the event's organizer, and by nothing else — which includes this service's
 * anonymous key. It reads with the service role for the same reason the sealed
 * tables do: refusing a card needs the answer now, and the card arrives while
 * the declarations are still private.
 *
 * Read on each submission rather than cached. A judge declares a conflict and
 * then stops scoring that project seconds later, and a cache measured in
 * minutes would accept exactly the card the declaration exists to refuse.
 */

export interface Declared {
  team: number;
  relationship: string;
}

export type DeclarationReader = (contract: string, judge: string) => Promise<Declared[]>;

/** What PostgREST hands back for the one query this module makes. */
export interface DeclarationRows {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
}

export type DeclarationQuery = (contract: string, judge: string) => Promise<DeclarationRows>;

/**
 * The reader, over whatever answers the query.
 *
 * Split from the client so the rule above it can be tested against the shapes
 * PostgREST really returns — including the failure — without a database. The
 * mapping is the part worth pinning: `team_id` arrives as whatever the driver
 * decided, and a team compared as a string against a team compared as a number
 * finds no conflict at all.
 */
export function readDeclarations(query: DeclarationQuery): DeclarationReader {
  return async (contract, judge) => {
    const { data, error } = await query(contract, judge);

    if (error !== null) {
      // Thrown rather than answered as "no conflicts". A read that failed knows
      // nothing, and treating it as an all clear would let a card through at
      // exactly the moment the service cannot tell whether it should.
      throw new Error(`could not read the conflict declarations: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      team: Number(row["team_id"]),
      relationship: String(row["relationship"]),
    }));
  };
}

const db = createClient(settings.supabaseUrl, settings.serviceRoleKey, {
  auth: { persistSession: false },
});

/** Every conflict this judge has declared for this hackathon. */
export const declarationsOf: DeclarationReader = readDeclarations(async (contract, judge) =>
  db
    .from("conflict_declarations")
    .select("team_id, relationship")
    .eq("contract_id", contract)
    .eq("judge", judge),
);
