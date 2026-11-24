import { cacheFor, errorResponse, guard, results } from "../../../../../../lib/public-api";
import { serverClient } from "../../../../../../lib/supabase/server";

/**
 * The ranking by track, with the payment that settled each placing.
 *
 * Scores are null until the event's reveal, and the track says `revealed:
 * false` beside them. The placing itself is not withheld — the contract ranked
 * publicly — but the numbers behind it are sealed until the reveal, and serving
 * a zero would be serving something that reads like a score.
 *
 * One answer rather than a page: a hackathon has a handful of tracks, and
 * paging a list that is never long enough to need it would make every consumer
 * write a loop for nothing. The envelope is still the page shape, so the same
 * code reads this as reads the lists.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { headers, refused } = guard(request);

  if (refused !== null) {
    return refused;
  }

  const { slug } = await context.params;
  const db = await serverClient();

  if (db === null) {
    return errorResponse("unavailable", "no database is configured for this deployment", headers);
  }

  const { data: event } = await db.from("hackathons").select("contract_id").eq("slug", slug).maybeSingle();

  if (event === null) {
    return errorResponse("not_found", slug, headers);
  }

  const contract = String(event.contract_id);
  const [state, ranked, payments] = await Promise.all([
    db.from("hackathon_state").select("phase").eq("contract_id", contract).maybeSingle(),
    db
      .from("results")
      .select("track, rank, team_id, final_score, judge_average, community, decided_by")
      .eq("contract_id", contract),
    db.from("payments").select("track, rank, recipient, amount, kind, ledger, tx_hash").eq("contract_id", contract),
  ]);

  if (ranked.error !== null) {
    return errorResponse("unavailable", ranked.error.message, headers);
  }

  const phase = state.data === null ? null : Number(state.data.phase);

  return Response.json(
    { items: results(phase, ranked.data ?? [], payments.data ?? []), nextCursor: null },
    { headers: { ...headers, "cache-control": cacheFor(phase) } },
  );
}
