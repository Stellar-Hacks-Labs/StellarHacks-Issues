import {
  cacheFor,
  errorResponse,
  fetchCount,
  guard,
  pageOf,
  project,
  readPageRequest,
} from "../../../../../../lib/public-api";
import { serverClient } from "../../../../../../lib/supabase/server";

/**
 * The entries of one hackathon, as its public gallery shows them.
 *
 * "As its public gallery shows them" is load bearing. The write up lives in
 * `projects`, which is governed by the gallery policy — a restricted event
 * serves no project rows to a stranger, and this route inherits that by reading
 * with the anonymous key rather than deciding visibility itself.
 *
 * The submission record is different and is joined in deliberately: the digest,
 * the track and the deadline stay public at every visibility, because they are
 * what make a receipt checkable by somebody outside the event.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { headers, refused } = guard(request);

  if (refused !== null) {
    return refused;
  }

  const asked = readPageRequest(new URL(request.url).searchParams);

  if (!asked.ok) {
    return asked.response;
  }

  const { slug } = await context.params;
  const db = await serverClient();

  if (db === null) {
    return errorResponse("unavailable", "no database is configured for this deployment", headers);
  }

  const { data: event } = await db
    .from("hackathons")
    .select("contract_id")
    .eq("slug", slug)
    .maybeSingle();

  if (event === null) {
    return errorResponse("not_found", slug, headers);
  }

  const contract = String(event.contract_id);
  const [state, entries, projects] = await Promise.all([
    db.from("hackathon_state").select("phase").eq("contract_id", contract).maybeSingle(),
    db
      .from("submissions")
      .select("team_id, track, metadata_hash, submitted_at, status")
      .eq("contract_id", contract)
      .order("team_id", { ascending: true })
      .gt("team_id", asked.page.after === null ? 0 : Number(asked.page.after))
      .limit(fetchCount(asked.page.limit)),
    db.from("projects").select("team_id, title, summary, repository_url, demo_video_url, live_url").eq("contract_id", contract),
  ]);

  if (entries.error !== null) {
    return errorResponse("unavailable", entries.error.message, headers);
  }

  const written = new Map(
    (projects.data ?? []).map((row) => [Number(row.team_id), row as Record<string, unknown>]),
  );

  const page = pageOf(
    (entries.data ?? []).map((entry) => {
      const team = Number(entry.team_id);
      const story = written.get(team) ?? {};

      return {
        key: String(team),
        item: project({
          team_id: team,
          title: story["title"] ?? `Team ${team}`,
          summary: story["summary"],
          repository_url: story["repository_url"],
          demo_video_url: story["demo_video_url"],
          live_url: story["live_url"],
          track: entry.track,
          digest: entry.metadata_hash,
          /* The ledger is not in this table; the timestamp the indexer recorded
             is, and a reader asking "when was this pinned" is answered by the
             submission record on the event's own proof page. Left null rather
             than filled with a converted timestamp that would read as a ledger
             sequence. */
          submitted_at_ledger: null,
          invalid: Number(entry.status) === 2,
        }),
      };
    }),
    asked.page.limit,
    (row) => row.key,
  );

  const phase = state.data === null ? null : Number(state.data.phase);

  return Response.json(
    { items: page.items.map((row) => row.item), nextCursor: page.nextCursor },
    { headers: { ...headers, "cache-control": cacheFor(phase) } },
  );
}
