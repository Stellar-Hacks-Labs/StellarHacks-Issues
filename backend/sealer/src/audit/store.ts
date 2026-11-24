import { createClient } from "@supabase/supabase-js";
import { settings } from "../config.js";
import type { AuditCheckpoint } from "./checkpoint.js";
import type { AuditEntry } from "./entry.js";

const db = createClient(settings.supabaseUrl, settings.serviceRoleKey, { auth: { persistSession: false } });

export async function auditEntries(contract: string): Promise<AuditEntry[]> {
  const { data, error } = await db.from("sealer_audit_entries").select("*").eq("contract_id", contract).order("sequence");
  if (error) throw new Error("could not read audit log");
  return (data ?? []).map((row) => ({ sequence: Number(row.sequence), contract: String(row.contract_id), action: String(row.action), outcome: row.outcome as AuditEntry["outcome"], subjectHash: String(row.subject_hash), previousHash: row.previous_hash === null ? null : String(row.previous_hash), recordedAt: String(row.recorded_at), hash: String(row.entry_hash) }));
}

export async function appendAudit(entry: AuditEntry): Promise<void> {
  const { error } = await db.from("sealer_audit_entries").insert({ contract_id: entry.contract, sequence: entry.sequence, action: entry.action, outcome: entry.outcome, subject_hash: entry.subjectHash, previous_hash: entry.previousHash, recorded_at: entry.recordedAt, entry_hash: entry.hash });
  if (error) throw new Error("audit append failed");
}

export async function saveCheckpoint(checkpoint: AuditCheckpoint): Promise<void> {
  const { error } = await db.from("sealer_audit_checkpoints").insert({ contract_id: checkpoint.contract, sequence: checkpoint.sequence, head: checkpoint.head, signer: checkpoint.signer, signature: checkpoint.signature, created_at: checkpoint.createdAt });
  if (error) throw new Error("audit checkpoint write failed");
}

export async function auditCheckpoints(contract: string) {
  const { data, error } = await db.from("sealer_audit_checkpoints").select("*").eq("contract_id", contract).order("sequence");
  if (error) throw new Error("could not read audit checkpoints");
  return data ?? [];
}
