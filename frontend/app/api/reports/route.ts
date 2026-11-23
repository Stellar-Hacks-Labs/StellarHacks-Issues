import { NextResponse } from "next/server";
import { decide, draftReport, reportAllowed } from "../../../lib/moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const reporterId = request.headers.get("x-reader-id") ?? "";
  const body = (await request.json()) as { target?: { type: "project" | "profile"; id: string }; category?: string; note?: string; previous?: number[]; now?: number };
  const now = body.now ?? Date.now();
  if (!reportAllowed(body.previous ?? [], now)) {
    return NextResponse.json({ error: "too many reports" }, { status: 429 });
  }
  const report = draftReport({
    target: body.target ?? { type: "project", id: "" },
    category: body.category ?? "",
    note: body.note ?? "",
    reporterId,
    now: new Date(now).toISOString(),
  });
  if ("error" in report) return NextResponse.json({ error: report.error }, { status: 400 });
  return NextResponse.json({ report }, { status: 201, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const staff = request.headers.get("x-reader-staff") === "1";
  if (!staff) return NextResponse.json({ error: "staff only" }, { status: 403 });
  return NextResponse.json({ reports: [] }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { reportId?: string; action?: string; reason?: string; at?: string };
  const decision = decide({
    reportId: body.reportId ?? "",
    action: body.action ?? "",
    actorId: request.headers.get("x-reader-id") ?? "",
    at: body.at ?? "",
    reason: body.reason ?? "",
    staff: request.headers.get("x-reader-staff") === "1",
  });
  if ("error" in decision) return NextResponse.json({ error: decision.error }, { status: 403 });
  return NextResponse.json({ decision }, { headers: { "cache-control": "no-store" } });
}
