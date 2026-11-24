import { sealer } from "../core.js";

export function auditPublicKey(): string {
  return sealer.publicKey();
}
