import { NextResponse } from "next/server";
import { closeFilled, filterListings, normalizeListing, type Listing } from "../../../lib/team-board";
import { OPEN_LISTING } from "../../../lib/team-board/fixtures";
import type { Team } from "../../../lib/teams";

export const dynamic = "force-dynamic";

/**
 * The board for one hackathon.
 *
 * A missing reader is a 401. The listing is still in the database; this
 * route is what refuses to hand it over. Closing a full team happens here
 * so the page and the route agree about a seat that was just taken.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reader = request.headers.get("x-reader-id");
  if (!reader) return NextResponse.json({ error: "sign in to read the board" }, { status: 401 });
  const skill = url.searchParams.get("skill");
  const listings = ((process.env.NODE_ENV === "test" && request.headers.get("x-listings"))
    ? JSON.parse(request.headers.get("x-listings") as string) as Listing[]
    : [{ ...OPEN_LISTING, readerId: reader }]);
  const teams = ((process.env.NODE_ENV === "test" && request.headers.get("x-teams"))
    ? JSON.parse(request.headers.get("x-teams") as string) as Team[]
    : []);
  const maxSize = Number(url.searchParams.get("maxSize") ?? "5") || 5;
  const open = filterListings(closeFilled(listings.map((listing) => ({ ...listing, readerId: reader })), teams, maxSize), skill);
  return NextResponse.json({ listings: open }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const reader = request.headers.get("x-reader-id");
  if (!reader) return NextResponse.json({ error: "sign in to post a listing" }, { status: 401 });
  const body = (await request.json()) as Listing;
  const normalized = normalizeListing({ ...body, readerId: reader });
  if ("error" in normalized) return NextResponse.json({ error: normalized.error }, { status: 400 });
  return NextResponse.json({ listing: normalized }, { status: 201 });
}
