import { NextResponse } from "next/server";
import { currentUser, serverClient } from "../../../lib/supabase/server";
import { readNotifications } from "../../../lib/notifications/read";

export async function GET() {
  if (!(await currentUser()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const notifications = await readNotifications();
  return NextResponse.json({
    notifications,
    unread: notifications.filter((item) => item.read_at === null).length,
  });
}
export async function PATCH(request: Request) {
  const [user, db] = await Promise.all([currentUser(), serverClient()]);
  if (!user || !db)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json()) as { id?: number };
  if (!Number.isInteger(body.id))
    return NextResponse.json(
      { error: "invalid notification" },
      { status: 400 },
    );
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("user_id", user.id);
  return error
    ? NextResponse.json({ error: "write failed" }, { status: 500 })
    : NextResponse.json({ ok: true });
}
