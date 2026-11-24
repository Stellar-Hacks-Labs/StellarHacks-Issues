import { createClient } from "@supabase/supabase-js";
import { settings } from "./config.js";

export interface DeadLetter {
  contractId: string;
  transition: string;
  lastError: string;
  transactionHash?: string;
}

export async function writeDeadLetter(letter: DeadLetter): Promise<void> {
  const db = createClient(settings.supabaseUrl, settings.serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await db.from("clock_dead_letters").insert({
    contract_id: letter.contractId,
    transition: letter.transition,
    last_error: letter.lastError.slice(0, 2_000),
    transaction_hash: letter.transactionHash ?? null,
  });
  if (error) throw new Error(`dead-letter write failed: ${error.message}`);
}
