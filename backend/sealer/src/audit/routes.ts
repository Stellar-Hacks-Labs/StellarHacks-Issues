import { auditCheckpoints, auditEntries } from "./store.js";

export async function auditRoute(path: string, contract: string) {
  if (path === "/audit") return { entries: await auditEntries(contract) };
  if (path === "/audit/checkpoints") return { checkpoints: await auditCheckpoints(contract) };
  return null;
}
