import { createHash } from "node:crypto";
export function notificationKey(contract: string, ledger: number, index: number, user: string, type: string) {
  return createHash("sha256").update(`${contract}:${ledger}:${index}:${user}:${type}`).digest("hex");
}
