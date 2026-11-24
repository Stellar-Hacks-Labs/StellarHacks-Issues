import { serverClient } from "../supabase/server";
export async function readNotifications() {
  const db = await serverClient();
  if (!db) return [];
  const { data, error } = await db
    .from("notifications")
    .select("id,type,message,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error("Could not read notifications");
  return data ?? [];
}
