import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { Keypair } from "@stellar/stellar-sdk";

import { credentialDigest, type Credential, type CredentialPayload } from "../src/credentials/format.js";
import { signedPayload } from "../src/signing.js";

/**
 * Writes the committed credential fixtures.
 *
 * Run with `npx vite-node scripts/make-credential-fixtures.ts` from `sdk/`
 * after changing the format, and commit what it writes. The signatures have to
 * be real — a fixture with a made up signature would make every verification
 * test pass for the wrong reason — so they are produced here by a keypair whose
 * secret is in this file on purpose: it signs three files in a repository and
 * nothing else, and a reader checking the fixtures needs to be able to
 * reproduce them.
 */

const ISSUER = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 7));
const SUBJECT = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";
const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";

function sign(payload: CredentialPayload): Credential {
  const signature = ISSUER.sign(Buffer.from(signedPayload(credentialDigest(payload))));

  return { ...payload, signature: signature.toString("hex") };
}

const placement: CredentialPayload = {
  version: "stelhacks.credential.v1",
  subject: { address: SUBJECT, username: "ada" },
  claim: { kind: "placement", track: "ai", rank: 1, team: 3, finalScore: 9_000 },
  evidence: {
    contract: CONTRACT,
    slug: "a-finished-event",
    constitutionHash: "cd".repeat(32),
    payoutTxHash: "ab".repeat(32),
    submissionDigest: "11".repeat(32),
    scoreRoot: "22".repeat(32),
  },
  issuer: { keyId: ISSUER.publicKey(), signedAt: "2026-11-21T10:00:00.000Z" },
};

const participation: CredentialPayload = {
  version: "stelhacks.credential.v1",
  subject: { address: SUBJECT, username: "ada" },
  claim: { kind: "participation", role: "judge", team: null },
  evidence: {
    contract: CONTRACT,
    slug: "a-finished-event",
    constitutionHash: "cd".repeat(32),
    payoutTxHash: null,
    submissionDigest: null,
    scoreRoot: "22".repeat(32),
  },
  issuer: { keyId: ISSUER.publicKey(), signedAt: "2026-11-21T10:05:00.000Z" },
};

const signedPlacement = sign(placement);

/* The forgery: one field edited and the signature left alone, which is what a
   credential somebody improved for themselves actually looks like. The score
   is the field to move, because it is the one a reader is most likely to care
   about and the one the ranking can contradict. */
const tampered: Credential = {
  ...signedPlacement,
  claim: { kind: "placement", track: "ai", rank: 1, team: 3, finalScore: 10_000 },
};

const directory = join(import.meta.dirname, "..", "..", "fixtures", "credentials");

writeFileSync(join(directory, "placement.json"), `${JSON.stringify(signedPlacement, null, 2)}\n`);
writeFileSync(join(directory, "participation.json"), `${JSON.stringify(sign(participation), null, 2)}\n`);
writeFileSync(join(directory, "tampered.json"), `${JSON.stringify(tampered, null, 2)}\n`);

console.log("issuer:", ISSUER.publicKey());
