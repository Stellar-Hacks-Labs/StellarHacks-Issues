import { NextResponse } from "next/server";

import { SAMPLE_DOCUMENTS } from "../../../lib/search/fixtures";
import { searchCatalog, type Reader, type SearchDocument } from "../../../lib/search";
import { anonymousReader } from "../../../lib/search/read";

export const dynamic = "force-dynamic";

/**
 * Search the catalogue the reader is allowed to see.
 *
 * The corpus header exists so a test can hand the route a known catalogue
 * without a database. It is ignored outside the test environment, because a
 * request must not be able to replace the index in production.
 */
function corpusFrom(request: Request): SearchDocument[] {
  const header = request.headers.get("x-search-corpus");
  if (process.env.NODE_ENV === "test" && header) {
    return JSON.parse(header) as SearchDocument[];
  }
  return SAMPLE_DOCUMENTS;
}

function readerFrom(request: Request): Reader {
  const header = request.headers.get("x-search-reader");
  if (process.env.NODE_ENV === "test" && header) {
    return JSON.parse(header) as Reader;
  }
  return anonymousReader();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = searchCatalog(corpusFrom(request), readerFrom(request), {
    q: url.searchParams.get("q") ?? undefined,
    phase: url.searchParams.get("phase") ?? undefined,
    prizeAsset: url.searchParams.get("prizeAsset") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    page: Number(url.searchParams.get("page") ?? "1") || 1,
  });
  return NextResponse.json(page, { headers: { "cache-control": "no-store" } });
}
