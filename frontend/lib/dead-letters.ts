import { serverClient } from "./supabase/server";

export async function deadLettersFor(contractId: string) {
  const db = await serverClient();
  if (db === null) return [];
  const { data, error } = await db.from("clock_dead_letters").select("id,transition,last_error,created_at").eq("contract_id", contractId).is("resolved_at", null).order("created_at", { ascending: false });
  if (error) throw new Error("Could not read transition failures");
  return data ?? [];
}
