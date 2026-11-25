import { NextResponse } from "next/server";

import {
  build,
  credentialId,
  keyId,
  signPayload,
  signingConfigured,
  signingKeypair,
  type EventRecords,
} from "../../../lib/credentials";
import { serverClient } from "../../../lib/supabase/server";

/**
 * Issuing a builder's credentials, which happens here and nowhere else.
 *
 * Here because this is the only place the signing key exists: it is read from a
 * variable with no `NEXT_PUBLIC_` prefix, so it is never in a client bundle,
 * and `signingKeypair` throws outright if it is ever reached from a browser.
 * The export control on a profile page asks this route and receives finished
 * credentials; it never sees a key.
 *
 * What is signed is derived, not supplied. The claims come from the records
 * this route reads — the ranking, the team membership, the payments — so a
 * request cannot ask for a credential saying something the chain does not. The
 * only thing a caller chooses is which address to export for, and that address
 * is public.
 *
 * `GET` answers which key id this deployment signs with, so a verification page
 * can say which key to expect before anybody pastes anything.
 */

export const dynamic = "force-dynamic";

const ADDRESS = /^G[A-Z2-7]{55}$/;

export async function GET() {
  return NextResponse.json(
    { keyId: keyId(), signing: signingConfigured() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!signingConfigured()) {
    return NextResponse.json(
      { error: "this deployment has no credential signing key, so it cannot issue credentials" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "that is not JSON" }, { status: 400 });
  }

  const address = String(body["address"] ?? "");
  const role = body["role"] === undefined ? undefined : String(body["role"]);

  if (!ADDRESS.test(address)) {
    return NextResponse.json({ error: "that is not a Stellar account address" }, { status: 400 });
  }
  if (role !== undefined && !["builder", "judge", "organizer", "sponsor"].includes(role)) {
    return NextResponse.json({ error: "that is not a role this platform records" }, { status: 400 });
  }

  const db = await serverClient();

  if (db === null) {
    return NextResponse.json({ error: "no database is configured for this deployment" }, { status: 503 });
  }

  const { data: memberships, error } = await db
    .from("team_members")
    .select("contract_id, team_id")
    .eq("address", address);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const contracts = [...new Set((memberships ?? []).map((row) => String(row.contract_id)))];

  if (contracts.length === 0) {
    /* Not an error. A wallet with no recorded participation has nothing to
       export, and saying so is better than an empty list the page has to
       interpret. */
    return NextResponse.json(
      { keyId: keyId(), credentials: [], says: "this address has no recorded participation yet" },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const [events, username] = await Promise.all([
    recordsFor(db, contracts, address, memberships ?? []),
    usernameOf(db, address),
  ]);

  const keypair = signingKeypair();
  const payloads = build({
    subject: { address, username },
    keyId: keypair.publicKey(),
    now: new Date().toISOString(),
    events,
    ...(role === undefined ? {} : { role: role as "builder" }),
  });

  return NextResponse.json(
    {
      keyId: keypair.publicKey(),
      credentials: payloads.map((payload) => ({
        ...payload,
        signature: signPayload(payload, keypair),
        id: credentialId(payload),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/** The records each event contributes to a claim, read with the anonymous key. */
async function recordsFor(
  db: NonNullable<Awaited<ReturnType<typeof serverClient>>>,
  contracts: string[],
  address: string,
  memberships: { contract_id: unknown; team_id: unknown }[],
): Promise<EventRecords[]> {
  const [events, states, results, payments, submissions] = await Promise.all([
    db.from("hackathons").select("contract_id, slug").in("contract_id", contracts),
    db.from("hackathon_state").select("contract_id, phase, constitution_hash").in("contract_id", contracts),
    db
      .from("results")
      .select("contract_id, track, rank, team_id, final_score")
      .in("contract_id", contracts),
    db
      .from("payments")
      .select("contract_id, track, rank, kind, tx_hash")
      .in("contract_id", contracts),
    db.from("submissions").select("contract_id, team_id, metadata_hash").in("contract_id", contracts),
  ]);

  const hex = (value: unknown): string | null => {
    const written = typeof value === "string" ? value.replace(/^\\x/, "").toLowerCase() : "";

    return /^[0-9a-f]{64}$/.test(written) ? written : null;
  };
  const slugs = new Map((events.data ?? []).map((row) => [String(row.contract_id), row.slug]));
  const stateOf = new Map((states.data ?? []).map((row) => [String(row.contract_id), row]));

  void address;

  return contracts.map((contract) => {
    const state = stateOf.get(contract);

    return {
      contract,
      slug: slugs.get(contract) === undefined ? null : String(slugs.get(contract)),
      phase: state === undefined ? null : Number(state.phase),
      constitutionHash: state === undefined ? null : hex(state.constitution_hash),
      /* The sealed roots are the chain's and this route does not read the
         chain. Left null rather than filled from a table: a credential citing
         our copy of a root would be citing us. */
      scoreRoot: null,
      placements: (results.data ?? [])
        .filter((row) => String(row.contract_id) === contract)
        .map((row) => ({
          track: String(row.track),
          rank: Number(row.rank),
          team: Number(row.team_id),
          finalScore: row.final_score === null ? null : Number(row.final_score),
        })),
      teams: memberships
        .filter((row) => String(row.contract_id) === contract)
        .map((row) => Number(row.team_id)),
      submissions: (submissions.data ?? [])
        .filter((row) => String(row.contract_id) === contract)
        .map((row) => ({ team: Number(row.team_id), digest: hex(row.metadata_hash) })),
      payments: (payments.data ?? [])
        .filter((row) => String(row.contract_id) === contract)
        .map((row) => ({
          track: String(row.track),
          rank: Number(row.rank),
          kind: Number(row.kind),
          txHash: hex(row.tx_hash) ?? "",
        })),
    };
  });
}

/** This platform's username for an address, which is a convenience and not an identity. */
async function usernameOf(
  db: NonNullable<Awaited<ReturnType<typeof serverClient>>>,
  address: string,
): Promise<string | null> {
  const { data: link } = await db
    .from("wallet_links")
    .select("profile_id")
    .eq("address", address)
    .maybeSingle();

  if (link === null) {
    return null;
  }

  const { data: profile } = await db
    .from("profiles")
    .select("username")
    .eq("id", String(link.profile_id))
    .maybeSingle();

  return profile === null ? null : String(profile.username);
}
