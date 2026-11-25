import { readFileSync } from "node:fs";

import { changedFields, verifyCredential, type ObservedEvent } from "../src/index.js";

/**
 * Checking a builder's credential from the command line.
 *
 *   npx vite-node examples/verify-credential.ts ../fixtures/credentials/placement.json
 *
 * Two layers run with nothing but the file: the shape and the platform's
 * signature. The third — whether the claim is what the chain says — needs the
 * event's records, and this example fetches them from the public API so the
 * whole thing works against a real deployment:
 *
 *   STELHACKS_API=https://stelhacks.app/api/v1 \
 *     npx vite-node examples/verify-credential.ts ./credential.json
 *
 * Without that, the example still reports the signature and says plainly that
 * the claim was compared against nothing — which is the distinction a reader
 * has to be able to see. A credential whose signature verifies is a credential
 * the platform assembled; only the evidence check makes it one nobody has to
 * take the platform's word for.
 */

const [path] = process.argv.slice(2);

if (path === undefined) {
  console.error("usage: verify-credential.ts <credential.json>");
  process.exit(2);
}

const credential = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
const api = process.env["STELHACKS_API"];

const observed = api === undefined ? undefined : await recordsFor(api, credential);
const report = verifyCredential(credential, observed);

console.log(report.ok ? "✓ this credential checks out" : "✗ this credential does not check out");

if (report.id !== null) {
  console.log(`  id         ${report.id}`);
}
if (report.signature !== null) {
  console.log(`  signature  ${report.signature.valid ? "valid" : "invalid"} — ${report.signature.says}`);
  console.log(`  key id     ${report.signature.keyId}`);
}

for (const problem of report.format) {
  console.log(`  shape      ${problem.field}: ${problem.says}`);
}

if (report.evidence === null) {
  console.log("  claim      not checked: no records were supplied, so nothing was compared");
} else {
  for (const problem of report.evidence) {
    console.log(`  claim      ${problem.field}: ${problem.says}`);
  }
  if (report.evidence.length === 0) {
    console.log("  claim      agrees with the records supplied");
  }
}

for (const note of report.coverage) {
  console.log(`  coverage   ${note}`);
}

const changed = changedFields(report);

if (changed.length > 0) {
  console.log(`\nfields that do not match: ${changed.join(", ")}`);
}

process.exit(report.ok ? 0 : 1);

/** The event's records, read from the public API rather than from the issuer. */
async function recordsFor(base: string, credential: Record<string, unknown>): Promise<ObservedEvent | undefined> {
  const evidence = credential["evidence"] as { slug?: string | null; contract?: string } | undefined;
  const slug = evidence?.slug;

  if (typeof slug !== "string") {
    console.error("the credential names no slug, so its records cannot be looked up");

    return undefined;
  }

  const read = async (path: string): Promise<Record<string, unknown>> =>
    (await fetch(`${base}${path}`).then((answer) => answer.json())) as Record<string, unknown>;

  const [event, results, proof] = await Promise.all([
    read(`/hackathons/${slug}`),
    read(`/hackathons/${slug}/results`),
    read(`/hackathons/${slug}/proof`),
  ]);

  const tracks = (results["items"] ?? []) as {
    track: string;
    placements: Record<string, number | null>[];
  }[];
  const payments = (proof["payments"] ?? []) as Record<string, unknown>[];
  const text = (value: unknown): string | null => (typeof value === "string" ? value : null);

  return {
    contract: String(event["contract"]),
    phase: typeof event["phase"] === "number" ? event["phase"] : null,
    constitutionHash: text(event["constitutionHash"]),
    scoreRoot: text(proof["scoreRoot"]),
    placements: tracks.flatMap((track) =>
      track.placements.map((placement) => ({
        track: track.track,
        rank: Number(placement["rank"]),
        team: Number(placement["team"]),
        finalScore: placement["finalScore"] === null ? null : Number(placement["finalScore"]),
      })),
    ),
    payments: payments.map((payment) => ({
      track: String(payment["track"]),
      rank: Number(payment["rank"]),
      recipient: String(payment["recipient"]),
      kind: Number(payment["kind"]),
      txHash: String(payment["txHash"]),
    })),
    /* The public API does not publish team membership, so this is left empty
       and the report says the subject's team could not be confirmed. Reading
       it from the chain is the next step for anybody who needs that too. */
    members: [],
    submissions: [],
  };
}
