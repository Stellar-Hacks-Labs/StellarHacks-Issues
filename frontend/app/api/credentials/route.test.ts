import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";

import { asking, SIGNING_SEED, SUBJECT } from "./fixtures";
import { verifyPayload } from "../../../lib/credentials";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));

const { GET, POST } = await import("./route");

const SECRET = "STELHACKS_CREDENTIAL_SECRET";
const keypair = Keypair.fromRawEd25519Seed(SIGNING_SEED);

let held: string | undefined;

beforeEach(() => {
  held = process.env[SECRET];
  process.env[SECRET] = keypair.secret();
  Reflect.deleteProperty(globalThis, "window");
  mocks.db.current = null;
});

afterEach(() => {
  if (held === undefined) delete process.env[SECRET];
  else process.env[SECRET] = held;
});

/**
 * The route that issues credentials, and the two things it must never do:
 * sign something a request asked for rather than something the records say,
 * and let the key anywhere near a reply.
 */

describe("asking which key this deployment signs with", () => {
  it("answers the public half and nothing else", async () => {
    const body = await (await GET()).json();

    expect(body).toEqual({ keyId: keypair.publicKey(), signing: true });
    expect(JSON.stringify(body)).not.toContain(keypair.secret());
  });

  it("says plainly when no key is configured", async () => {
    delete process.env[SECRET];

    await expect((await GET()).json()).resolves.toEqual({ keyId: null, signing: false });
  });
});

describe("asking for credentials", () => {
  it("refuses a body that is not JSON and an address that is not one", async () => {
    const badJson = await POST(
      new Request("http://localhost/api/credentials", { method: "POST", body: "{nope" }),
    );

    expect(badJson.status).toBe(400);
    await expect(badJson.json()).resolves.toEqual({ error: "that is not JSON" });

    const badAddress = await POST(asking({ address: "GNOPE" }));

    expect(badAddress.status).toBe(400);
    await expect(badAddress.json()).resolves.toEqual({
      error: "that is not a Stellar account address",
    });
  });

  it("refuses a role this platform does not record", async () => {
    const response = await POST(asking({ address: SUBJECT, role: "mascot" }));

    expect(response.status).toBe(400);
  });

  it("says so when the deployment cannot sign, before reading anything", async () => {
    delete process.env[SECRET];

    const response = await POST(asking({ address: SUBJECT }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("no credential signing key"),
    });
  });

  it("says so when there is no database behind this deployment", async () => {
    const response = await POST(asking({ address: SUBJECT }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "no database is configured for this deployment",
    });
  });
});

describe("a wallet with recorded participation", () => {
  beforeEach(() => {
    mocks.db.current = database();
  });

  it("receives one signed credential per claim, each verifying against the key id", async () => {
    const body = await (await POST(asking({ address: SUBJECT }))).json();

    expect(body.keyId).toBe(keypair.publicKey());
    expect(body.credentials).toHaveLength(1);

    const [credential] = body.credentials;
    const { signature, id, ...payload } = credential;

    expect(verifyPayload(payload, signature, body.keyId)).toBe(true);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(credential.claim).toEqual({ kind: "placement", track: "ai", rank: 1, team: 3, finalScore: 9_000 });
  });

  it("derives the claim from the records rather than from the request", async () => {
    /* The body asks for something flattering. The route reads the ranking and
       signs what it found, which is the whole reason the key lives here. */
    const body = await (
      await POST(asking({ address: SUBJECT, claim: { kind: "placement", rank: 1, track: "everything" } }))
    ).json();

    expect(body.credentials[0].claim.track).toBe("ai");
    expect(JSON.stringify(body)).not.toContain("everything");
  });

  it("cites the payout transaction and the submission digest the records carry", async () => {
    const body = await (await POST(asking({ address: SUBJECT }))).json();

    expect(body.credentials[0].evidence).toMatchObject({
      payoutTxHash: "ab".repeat(32),
      submissionDigest: "11".repeat(32),
      constitutionHash: "cd".repeat(32),
      /* Null on purpose: the roots are the chain's and this route does not read
         the chain, so citing our copy would be citing ourselves. */
      scoreRoot: null,
    });
  });

  it("never puts the signing key in a reply", async () => {
    const text = await (await POST(asking({ address: SUBJECT }))).text();

    expect(text).not.toContain(keypair.secret());
    expect(text).toContain(keypair.publicKey());
  });

  it("claims participation rather than a placement before the reveal", async () => {
    mocks.db.current = database({ phase: 4 });

    const body = await (await POST(asking({ address: SUBJECT }))).json();

    expect(body.credentials[0].claim).toEqual({ kind: "participation", role: "builder", team: 3 });
    expect(JSON.stringify(body)).not.toContain("9000");
  });
});

describe("a wallet with nothing recorded", () => {
  it("is told so rather than handed an empty list to interpret", async () => {
    mocks.db.current = database({ memberships: [] });

    const body = await (await POST(asking({ address: SUBJECT }))).json();

    expect(body.credentials).toEqual([]);
    expect(body.says).toContain("no recorded participation");
  });
});

/** The subset of PostgREST the route uses, over one recorded event. */
function database(options: { phase?: number; memberships?: Record<string, unknown>[] } = {}) {
  const contract = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
  const rows: Record<string, Record<string, unknown>[]> = {
    team_members: options.memberships ?? [{ contract_id: contract, team_id: 3, address: SUBJECT }],
    hackathons: [{ contract_id: contract, slug: "a-finished-event" }],
    hackathon_state: [
      { contract_id: contract, phase: options.phase ?? 7, constitution_hash: `\\x${"cd".repeat(32)}` },
    ],
    results: [{ contract_id: contract, track: "ai", rank: 1, team_id: 3, final_score: 9_000 }],
    payments: [{ contract_id: contract, track: "ai", rank: 1, kind: 0, tx_hash: `\\x${"ab".repeat(32)}` }],
    submissions: [{ contract_id: contract, team_id: 3, metadata_hash: `\\x${"11".repeat(32)}` }],
    wallet_links: [{ address: SUBJECT, profile_id: "profile-1" }],
    profiles: [{ id: "profile-1", username: "ada" }],
  };

  return {
    from(table: string) {
      let held = rows[table] ?? [];

      const query = {
        select: () => query,
        eq(column: string, value: unknown) {
          held = held.filter((row) => String(row[column]) === String(value));

          return query;
        },
        in(column: string, values: unknown[]) {
          const wanted = values.map(String);

          held = held.filter((row) => wanted.includes(String(row[column])));

          return query;
        },
        maybeSingle: () => Promise.resolve({ data: held[0] ?? null, error: null }),
        then: (resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown) =>
          Promise.resolve({ data: held, error: null }).then(resolve),
      };

      return query;
    },
  };
}
