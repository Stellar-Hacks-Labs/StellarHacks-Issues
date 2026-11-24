import { createHash } from "node:crypto";

export interface AuditEntry {
  sequence: number;
  contract: string;
  action: string;
  outcome: "accepted" | "rejected" | "revealed";
  subjectHash: string;
  previousHash: string | null;
  recordedAt: string;
  hash: string;
}

export function hashAuditFields(entry: Omit<AuditEntry, "hash">): string {
  return createHash("sha256").update(JSON.stringify(entry)).digest("hex");
}

export function makeAuditEntry(fields: Omit<AuditEntry, "hash">): AuditEntry {
  return { ...fields, hash: hashAuditFields(fields) };
}
