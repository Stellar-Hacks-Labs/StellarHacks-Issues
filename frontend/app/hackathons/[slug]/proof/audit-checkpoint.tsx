import { latestAuditCheckpoint } from "../../../../../lib/audit";

export async function AuditCheckpoint({ contract }: { contract: string }) {
  const checkpoint = await latestAuditCheckpoint(contract);
  if (checkpoint === null) return null;
  return <section className="border border-rule p-5"><h2 className="font-semibold">Sealer audit checkpoint</h2><p className="mt-2 break-all text-sm text-ink-soft">Entry {checkpoint.sequence}: {checkpoint.head}</p></section>;
}
