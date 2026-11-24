import { createHash } from "node:crypto";
import { sealer } from "../core.js";
import { nextEntry } from "./chain.js";
import { signCheckpoint } from "./checkpoint.js";
import { checkpointDue } from "./schedule.js";
import { appendAudit, auditEntries, saveCheckpoint } from "./store.js";

export async function recordAudit(contract: string, action: string, outcome: "accepted" | "rejected" | "revealed", subject: unknown) {
  const chain = await auditEntries(contract);
  const subjectHash = createHash("sha256").update(JSON.stringify(subject)).digest("hex");
  const entry = nextEntry({ previous: chain.at(-1) ?? null, contract, action, outcome, subjectHash });
  await appendAudit(entry);
  if (checkpointDue(entry.sequence)) await saveCheckpoint(signCheckpoint(contract, entry.sequence, entry.hash, sealer));
  return entry;
}

export * from "./chain.js";
export * from "./checkpoint.js";
export * from "./entry.js";
