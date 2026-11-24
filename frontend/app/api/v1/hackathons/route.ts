import {
  CACHE,
  errorResponse,
  fetchCount,
  guard,
  hackathonSummary,
  pageOf,
  readPageRequest,
} from "../../../../lib/public-api";
import { serverClient } from "../../../../lib/supabase/server";

/**
 * Every hackathon this platform knows of, newest first.
 *
 * Read with the anonymous key, so row level security has already decided what
 * a stranger may see before this route shapes anything. That is the whole
 * security model of this API and it is the same one the public pages use: there
 * is no service role in `app/api/v1` at all.
 *
 * Keyed on `created_at` and the contract for paging, because a slug can be
 * edited and a page boundary that moves when somebody renames their event is a
 * consumer silently skipping a row.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { headers, refused } = guard(request);

  if (refused !== null) {
    return refused;
  }

  const asked = readPageRequest(new URL(request.url).searchParams);

  if (!asked.ok) {
    return withHeaders(asked.response, headers);
  }

  const db = await serverClient();

  if (db === null) {
    return errorResponse("unavailable", "no database is configured for this deployment", headers);
  }

  let query = db
    .from("hackathons")
    .select("contract_id, slug, name, tagline, logo_url, created_at")
    .order("created_at", { ascending: false })
    .order("contract_id", { ascending: false })
    .limit(fetchCount(asked.page.limit));

  if (asked.page.after !== null) {
    const [at] = asked.page.after.split("|");

    /* Strictly older than the last row of the previous page. A cursor that
       included the row would repeat it, and a consumer paging through a growing
       list would see it twice. */
    query = query.lt("created_at", at);
  }

  const { data, error } = await query;

  if (error !== null) {
    return errorResponse("unavailable", error.message, headers);
  }

  const states = await db
    .from("hackathon_state")
    .select("contract_id, phase, visibility")
    .in("contract_id", (data ?? []).map((row) => String(row.contract_id)));

  const phases = new Map(
    (states.data ?? []).map((row) => [String(row.contract_id), row as Record<string, unknown>]),
  );

  const page = pageOf(
    (data ?? []).map((row) => {
      const state = phases.get(String(row.contract_id)) ?? {};

      return {
        key: `${String(row.created_at)}|${String(row.contract_id)}`,
        item: hackathonSummary({ ...row, phase: state["phase"], visibility: state["visibility"] }),
      };
    }),
    asked.page.limit,
    (row) => row.key,
  );

  return Response.json(
    { items: page.items.map((row) => row.item), nextCursor: page.nextCursor },
    { headers: { ...headers, "cache-control": CACHE.listing } },
  );
}

function withHeaders(response: Response, headers: Record<string, string>): Response {
  const merged = new Headers(response.headers);

  for (const [key, value] of Object.entries(headers)) {
    merged.set(key, value);
  }

  return new Response(response.body, { status: response.status, headers: merged });
}
