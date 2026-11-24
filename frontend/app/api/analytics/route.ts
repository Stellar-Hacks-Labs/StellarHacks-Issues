import { NextResponse } from "next/server";
import { readOrganizerAnalytics } from "../../../lib/analytics/read";
export async function GET(request: Request) {
  const contract = new URL(request.url).searchParams.get("contract");
  if (!contract)
    return NextResponse.json({ error: "contract required" }, { status: 400 });
  const analytics = await readOrganizerAnalytics(contract);
  return analytics === null
    ? NextResponse.json({ error: "not found" }, { status: 404 })
    : NextResponse.json(analytics);
}
