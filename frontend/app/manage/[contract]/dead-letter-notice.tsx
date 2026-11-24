import { deadLettersFor } from "../../../lib/dead-letters";

export async function DeadLetterNotice({ contractId }: { contractId: string }) {
  const failures = await deadLettersFor(contractId);
  if (failures.length === 0) return null;
  return <aside role="status" className="border border-broken p-4 text-broken">{failures.length} automatic transition {failures.length === 1 ? "needs" : "need"} operator attention.</aside>;
}
