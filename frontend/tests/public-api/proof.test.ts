import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, CONSTITUTION_HASH, fakeDatabase, LIVE_SLUG, SETTLED_SLUG, TX_HASH } from "./fixtures";
import { resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown }, roots: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));
vi.mock("../../lib/roots", () => ({
  rootsOf: async () => mocks.roots.current ?? { scores: null, ballots: null },
}));

const { GET } = await import("../../app/api/v1/hackathons/[slug]/proof/route");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
  mocks.roots.current = null;
});

describe("the proof of one event", () => {
  it("matches its published schema and carries the digests a reader checks", async () => {
    mocks.roots.current = { scores: "11".repeat(32), ballots: "22".repeat(32) };

    const response = await GET(asking(`/hackathons/${SETTLED_SLUG}/proof`), params(SETTLED_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(validate(schemaFor("getProof"), body)).toEqual([]);
    expect(body).toMatchObject({
      constitutionHash: CONSTITUTION_HASH,
      scoreRoot: "11".repeat(32),
      ballotRoot: "22".repeat(32),
      revealed: true,
    });
  });

  it("lists every payment out of the vault, with its ending kept distinct", async () => {
    const body = await (await GET(asking(`/hackathons/${SETTLED_SLUG}/proof`), params(SETTLED_SLUG))).json();

    expect(body.payments).toEqual([
      {
        track: "ai",
        rank: 1,
        recipient: "GCWINNER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
        amount: "3000",
        kind: 0,
        ledger: 5100,
        txHash: TX_HASH,
      },
    ]);
  });

  it("serves the rest when the chain cannot be reached, rather than failing", async () => {
    /* The roots are the chain's. An unreachable node means two nulls; the
       phase, the vault and the payments are still true, and a dashboard is
       better served by those than by a 503. */
    const response = await GET(asking(`/hackathons/${SETTLED_SLUG}/proof`), params(SETTLED_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.scoreRoot).toBeNull();
    expect(body.ballotRoot).toBeNull();
    expect(body.payments).toHaveLength(1);
    expect(validate(schemaFor("getProof"), body)).toEqual([]);
  });

  it("says plainly whether the reveal has happened", async () => {
    const live = await (await GET(asking(`/hackathons/${LIVE_SLUG}/proof`), params(LIVE_SLUG))).json();

    expect(live.revealed).toBe(false);
    expect(live.phase).toBe(4);
  });

  it("answers 404 for an event nobody published", async () => {
    expect((await GET(asking("/hackathons/nope/proof"), params("nope"))).status).toBe(404);
  });

  it("carries no sealed material, whatever the tables hold", async () => {
    const text = await (await GET(asking(`/hackathons/${LIVE_SLUG}/proof`), params(LIVE_SLUG))).text();

    for (const forbidden of ["ciphertext", "tlock", "signature", "scores"]) {
      expect(text.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });
});
