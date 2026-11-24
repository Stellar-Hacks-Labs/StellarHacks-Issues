import { db } from "../supabase.js";

export interface NotificationRow { recipient: string; contract_id: string; event_key: string; type: string; message: string }
export async function writeNotifications(rows: NotificationRow[]) {
  if (rows.length === 0) return;
  const addresses = [...new Set(rows.map((row) => row.recipient))];
  const links = await db.from("wallet_links").select("profile_id,address").in("address", addresses);
  if (links.error) throw new Error(`could not resolve notification recipients: ${links.error.message}`);
  const accounts = new Map((links.data ?? []).map((link) => [String(link.address), String(link.profile_id)]));
  const candidates = rows.flatMap(({ recipient, ...row }) => {
    const account = accounts.get(recipient);
    return account ? [{ ...row, user_id: account }] : [];
  });
  if (candidates.length === 0) return;
  const preferences = await db.from("notification_preferences").select("user_id,type,enabled").in("user_id", [...new Set(candidates.map((row) => row.user_id))]);
  if (preferences.error) throw new Error(`could not read notification preferences: ${preferences.error.message}`);
  const disabled = new Set((preferences.data ?? []).filter((preference) => preference.enabled === false).map((preference) => `${preference.user_id}:${preference.type}`));
  const insertable = candidates.filter((row) => !disabled.has(`${row.user_id}:${row.type}`));
  if (insertable.length === 0) return;
  const { error } = await db.from("notifications").upsert(insertable, { onConflict: "user_id,event_key,type", ignoreDuplicates: true });
  if (error) throw new Error(`could not write notifications: ${error.message}`);
}
