import { hash as sha256, Keypair } from "@stellar/stellar-sdk";

export interface AuditEntry { sequence: number; contract: string; action: string; outcome: "accepted" | "rejected" | "revealed"; subjectHash: string; previousHash: string | null; recordedAt: string; hash: string }
export interface AuditCheckpoint { contract: string; sequence: number; head: string; signer: string; signature: string; createdAt: string }

export function verifyAuditLog(entries: readonly AuditEntry[]): boolean {
  return entries.every((entry, index) => {
    const { hash, ...fields } = entry;
    const expected = sha256(Buffer.from(JSON.stringify(fields))).toString("hex");
    return hash === expected && entry.previousHash === (entries[index - 1]?.hash ?? null);
  });
}

export function verifyAuditCheckpoint(checkpoint: AuditCheckpoint, publishedKey: string): boolean {
  try {
    return checkpoint.signer === publishedKey && Keypair.fromPublicKey(publishedKey).verify(Buffer.from(checkpoint.head, "hex"), Buffer.from(checkpoint.signature, "hex"));
  } catch {
    return false;
  }
}
