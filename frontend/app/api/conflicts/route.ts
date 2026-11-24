import { NextResponse } from "next/server";

import { draftDeclaration, fromRows, rowFor } from "../../../lib/conflicts";
import { serverClient } from "../../../lib/supabase/server";

/**
 * A judge's conflict declarations, read and written as the person asking.
 *
 * As the person asking matters here more than anywhere else in this product.
 * The session's client carries the anonymous key, so every row this route can
 * see or write is a row the policies already allowed: a judge reaches their
 * own, an organizer reaches their event's, and a visitor reaches nothing until
 * the reveal. There is no service role in this file, which is what keeps the
 * rule in the database rather than in this handler's `if`s.
 *
 * The route still checks the body before sending it. Postgres would refuse a
 * relationship outside the list with a constraint violation, and a judge
 * filling in a form deserves the sentence rather than the constraint's name.
 */

export const dynamic = "force-dynamic";

const CONTRACT = /^C[A-Z2-7]{55}$/;

export async function GET(request: Request) {
  const contract = new URL(request.url).searchParams.get("contract") ?? "";

  if (!CONTRACT.test(contract)) {
    return NextResponse.json({ error: "that is not a hackathon address" }, { status: 400 });
  }

  const db = await serverClient();

  if (db === null) {
    return NextResponse.json({ error: "sign in is not configured here" }, { status: 503 });
  }

  const { data, error } = await db
    .from("conflict_declarations")
    .select("contract_id, judge, team_id, relationship, note, declared_at")
    .eq("contract_id", contract);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  /* No rows is the ordinary answer for a visitor before the reveal and for an
     event where nobody declared anything. The two are indistinguishable from
     here on purpose: saying "there are declarations you may not see" would
     leak the fact this page exists to hide. */
  const read = fromRows(data ?? []);

  return NextResponse.json(read, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "that is not JSON" }, { status: 400 });
  }

  const declaration = draftDeclaration({
    contract: String(body["contract"] ?? ""),
    judge: String(body["judge"] ?? ""),
    team: Number(body["team"] ?? 0),
    relationship: String(body["relationship"] ?? ""),
    note: String(body["note"] ?? ""),
    now: new Date().toISOString(),
  });

  if ("error" in declaration) {
    return NextResponse.json({ error: declaration.error }, { status: 400 });
  }

  const db = await serverClient();

  if (db === null) {
    return NextResponse.json({ error: "sign in is not configured here" }, { status: 503 });
  }

  /* Upsert rather than insert so a judge can correct what they said. The
     primary key is the hackathon, the judge and the team, and `declared_at`
     keeps its original value because the column has a default and this row
     does not carry one — a correction cannot make a late declaration look
     early. */
  const { error } = await db
    .from("conflict_declarations")
    .upsert(rowFor(declaration), { onConflict: "contract_id,judge,team_id" });

  if (error !== null) {
    /* The policies answer a judge writing somebody else's declaration with a
       row level security violation, and that is the one failure worth naming:
       it is the rule working, not a fault. */
    const forbidden = error.message.includes("row-level security");

    return NextResponse.json(
      { error: forbidden ? "a judge can only declare their own conflicts" : error.message },
      { status: forbidden ? 403 : 502 },
    );
  }

  return NextResponse.json({ declaration }, { status: 201, headers: { "cache-control": "no-store" } });
}
