import { NextResponse } from "next/server";

import {
  exportBundle,
  previewBundle,
  type BundleSource,
  type ChainEventRow,
  type ChainReadRow,
} from "../../../lib/bundle";
import { db } from "../../../lib/chain";
import { completedSource, unrevealedSource } from "./fixtures";

export const dynamic = "force-dynamic";

/**
 * Download or preview an evidence bundle for one hackathon.
 *
 * `?preview=1` returns JSON with size and file list so the proof page can show
 * what will be downloaded before anybody clicks. Anything else streams the zip.
 *
 * In tests the body can be replaced with a fixture name via `x-bundle-fixture`
 * so the route is exercised without a database.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const contractId = url.searchParams.get("contract");
  const preview = url.searchParams.get("preview") === "1";

  const source = await resolveSource(request, contractId);
  if (source === null) {
    return NextResponse.json({ error: "hackathon not found" }, { status: 404 });
  }

  if (preview) {
    const summary = previewBundle(source);
    return NextResponse.json(summary, { headers: { "cache-control": "no-store" } });
  }

  const bytes = exportBundle(source);
  const filename = `stelhacks-${source.contractId.slice(0, 8)}.zip`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "content-length": String(bytes.byteLength),
    },
  });
}

async function resolveSource(
  request: Request,
  contractId: string | null,
): Promise<BundleSource | null> {
  const fixture = request.headers.get("x-bundle-fixture");
  if (process.env.NODE_ENV === "test" && fixture) {
    if (fixture === "completed") {
      return completedSource;
    }
    if (fixture === "unrevealed") {
      return unrevealedSource;
    }
  }

  if (contractId === null || contractId.length === 0 || db === null) {
    return null;
  }

  const [events, reads] = await Promise.all([
    readEvents(contractId),
    readReads(contractId),
  ]);

  if (events.length === 0 && reads.length === 0) {
    return null;
  }

  return { contractId, events, reads };
}

async function readEvents(contractId: string): Promise<ChainEventRow[]> {
  const rows: ChainEventRow[] = [];
  const page = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await db!
      .from("chain_events")
      .select("contract_id,ledger,event_index,name,payload,occurred_at")
      .eq("contract_id", contractId)
      .order("ledger")
      .order("event_index")
      .range(from, from + page - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as ChainEventRow[];
    rows.push(...batch);
    if (batch.length < page) {
      break;
    }
    from += page;
  }

  return rows;
}

async function readReads(contractId: string): Promise<ChainReadRow[]> {
  const rows: ChainReadRow[] = [];
  const page = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await db!
      .from("chain_reads")
      .select("contract_id,ledger,kind,key,data")
      .eq("contract_id", contractId)
      .order("ledger")
      .order("kind")
      .order("key")
      .range(from, from + page - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as ChainReadRow[];
    rows.push(...batch);
    if (batch.length < page) {
      break;
    }
    from += page;
  }

  return rows;
}
