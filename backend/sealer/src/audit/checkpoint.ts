import type { Keypair } from "@stellar/stellar-sdk";

export interface AuditCheckpoint {
  contract: string;
  sequence: number;
  head: string;
  signer: string;
  signature: string;
  createdAt: string;
}

export function signCheckpoint(contract: string, sequence: number, head: string, key: Keypair): AuditCheckpoint {
  return {
    contract,
    sequence,
    head,
    signer: key.publicKey(),
    signature: key.sign(Buffer.from(head, "hex")).toString("hex"),
    createdAt: new Date().toISOString(),
  };
}
