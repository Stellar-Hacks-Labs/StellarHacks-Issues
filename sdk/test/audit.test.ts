import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { verifyAuditCheckpoint } from "../src/audit.js";

describe("audit checkpoints", () => {
  it("verifies only against the published sealer key", () => {
    const key = Keypair.random();
    const head = "ab".repeat(32);
    const checkpoint = { contract: "C", sequence: 1, head, signer: key.publicKey(), signature: key.sign(Buffer.from(head, "hex")).toString("hex"), createdAt: new Date(0).toISOString() };
    expect(verifyAuditCheckpoint(checkpoint, key.publicKey())).toBe(true);
    expect(verifyAuditCheckpoint(checkpoint, Keypair.random().publicKey())).toBe(false);
  });
});
