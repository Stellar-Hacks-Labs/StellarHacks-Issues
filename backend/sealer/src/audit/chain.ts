import { makeAuditEntry, type AuditEntry } from "./entry.js";

export function nextEntry(input: {
  previous: AuditEntry | null;
  contract: string;
  action: string;
  outcome: AuditEntry["outcome"];
  subjectHash: string;
  recordedAt?: string;
}): AuditEntry {
  return makeAuditEntry({
    sequence: (input.previous?.sequence ?? 0) + 1,
    contract: input.contract,
    action: input.action,
    outcome: input.outcome,
    subjectHash: input.subjectHash,
    previousHash: input.previous?.hash ?? null,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  });
}

export function verifyAuditChain(entries: readonly AuditEntry[]): boolean {
  return entries.every((entry, index) => {
    const expected = makeAuditEntry({
      sequence: entry.sequence,
      contract: entry.contract,
      action: entry.action,
      outcome: entry.outcome,
      subjectHash: entry.subjectHash,
      previousHash: entry.previousHash,
      recordedAt: entry.recordedAt,
    });
    return expected.hash === entry.hash && entry.previousHash === (entries[index - 1]?.hash ?? null);
  });
}
