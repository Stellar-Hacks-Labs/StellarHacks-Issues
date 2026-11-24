import { cacheFor, errorResponse, guard, proof } from "../../../../../../lib/public-api";
import { rootsOf } from "../../../../../../lib/roots";
import { serverClient } from "../../../../../../lib/supabase/server";

/**
 * What a reader needs to check one event without trusting this API.
 *
 * The digests and the roots come from the chain rather than from our tables,
 * which is the point: an endpoint that served our copy of a root would be
 * asking to be trusted about the one value that exists so nobody has to be.
 * The payments come from the indexed ledger log, because a payment is a ledger
 * fact the contract does not keep.
 *
 * An unreachable chain answers with nulls for the roots rather than failing the
 * whole route. The phase, the payments and the vault are still true, and a
 * dashboard that could not show a root is better served by the rest than by a
 * 503.
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
  const [state, payments, roots] = await Promise.all([
    db
      .from("hackathon_state")
      .select("phase, constitution_hash, prize_asset, vault_id")
      .eq("contract_id", contract)
      .maybeSingle(),
    db.from("payments").select("track, rank, recipient, amount, kind, ledger, tx_hash").eq("contract_id", contract),
    rootsOf(contract).catch(() => ({ scores: null, ballots: null })),
  ]);

  const phase = state.data === null ? null : Number(state.data.phase);

  return Response.json(
    proof({
      contract,
      phase,
      constitutionHash: state.data?.constitution_hash,
      scoreRoot: roots.scores,
      ballotRoot: roots.ballots,
      vault: state.data?.vault_id,
      prizeAsset: state.data?.prize_asset,
      payments: payments.data ?? [],
    }),
    { headers: { ...headers, "cache-control": cacheFor(phase) } },
  );
}
