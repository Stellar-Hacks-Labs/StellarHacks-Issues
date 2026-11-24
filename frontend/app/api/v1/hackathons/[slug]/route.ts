import { cacheFor, errorResponse, guard, hackathon } from "../../../../../lib/public-api";
import { serverClient } from "../../../../../lib/supabase/server";

/**
 * One hackathon, with the digest of its frozen rules.
 *
 * The digest is the field that matters here: everything else on this page is
 * presentation an organizer typed, and that one value is what lets a consumer
 * rebuild the rules from the public page, hash them, and see that the
 * competition described is the one that was announced.
 *
 * Counts come from the derived tables rather than from the chain, and are
 * nullable for that reason: an event the indexer has not caught up with has an
 * unknown number of teams, which is not the same as none.
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

  const { data: event, error } = await db
    .from("hackathons")
    .select("contract_id, slug, name, tagline, description, logo_url, website_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error !== null) {
    return errorResponse("unavailable", error.message, headers);
  }
  if (event === null) {
    return errorResponse("not_found", slug, headers);
  }

  const contract = String(event.contract_id);
  const [state, teams, submissions] = await Promise.all([
    db
      .from("hackathon_state")
      .select("phase, visibility, organizer, constitution_hash, prize_asset, vault_id")
      .eq("contract_id", contract)
      .maybeSingle(),
    db.from("teams").select("team_id", { count: "exact", head: true }).eq("contract_id", contract),
    db.from("submissions").select("team_id", { count: "exact", head: true }).eq("contract_id", contract),
  ]);

  const phase = state.data === null ? null : Number(state.data.phase);

  return Response.json(
    hackathon({
      ...event,
      ...(state.data ?? {}),
      teams: teams.count,
      submissions: submissions.count,
    }),
    { headers: { ...headers, "cache-control": cacheFor(phase) } },
  );
}
