import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG, recorded, SETTLED_SLUG } from "./fixtures";
import { privateFieldsIn, resetRateLimits } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));
vi.mock("../../lib/roots", () => ({ rootsOf: async () => ({ scores: null, ballots: null }) }));

const listHackathons = (await import("../../app/api/v1/hackathons/route")).GET;
const getHackathon = (await import("../../app/api/v1/hackathons/[slug]/route")).GET;
const listProjects = (await import("../../app/api/v1/hackathons/[slug]/projects/route")).GET;
const listResults = (await import("../../app/api/v1/hackathons/[slug]/results/route")).GET;
const getProof = (await import("../../app/api/v1/hackathons/[slug]/proof/route")).GET;

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

/**
 * The two promises this API makes about what it never serves.
 *
 * Checked against every route rather than at the one place each could leak,
 * because the way a field like this escapes is never the route somebody was
 * thinking about: it is the one where a column was added to a select and
 * forwarded without being looked at.
 */

async function bodies() {
  return Promise.all(
    [
      await listHackathons(asking("/hackathons")),
      await getHackathon(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG)),
      await listProjects(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG)),
      await listResults(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG)),
      await getProof(asking(`/hackathons/${LIVE_SLUG}/proof`), params(LIVE_SLUG)),
      await listResults(asking(`/hackathons/${SETTLED_SLUG}/results`), params(SETTLED_SLUG)),
    ].map(async (response) => response.json()),
  );
}

describe("no private profile field", () => {
  it("appears in any answer, although the recorded rows carry some", async () => {
    // The recorded project row has an owner email and a profile id on it, as a
    // real row does.
    const row = recorded().projects[0] as Record<string, unknown>;

    expect(row["owner_email"]).toBeDefined();
    expect(row["profile_id"]).toBeDefined();

    for (const body of await bodies()) {
      expect(privateFieldsIn(body)).toEqual([]);
    }
  });

  it("appears in the serialized text either, which is the check a reviewer can repeat", async () => {
    const answers = await Promise.all((await bodies()).map(async (body) => JSON.stringify(body)));

    for (const text of answers) {
      for (const forbidden of ["example.invalid", "profile_id", "owner_email"]) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });
});

describe("no unrevealed score", () => {
  it("appears for an event that has not reached its reveal", async () => {
    const response = await listResults(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG));
    const text = await response.text();

    for (const score of ["8000", "7500", "6000"]) {
      expect(text, score).not.toContain(score);
    }
  });

  it("is withheld per event rather than globally, so a revealed event still publishes its scores", async () => {
    const body = await (await listResults(asking(`/hackathons/${SETTLED_SLUG}/results`), params(SETTLED_SLUG))).json();

    expect(body.items[0].revealed).toBe(true);
    expect(body.items[0].placements[0].finalScore).toBe(9_000);
  });

  it("is decided by the phase the indexer recorded, not by anything a request can ask for", async () => {
    /* There is no query parameter, header or body that can open a score early:
       the only input is `hackathon_state.phase`. Moving it is what opens them. */
    const before = await (await listResults(asking(`/hackathons/${LIVE_SLUG}/results?revealed=true`), params(LIVE_SLUG))).json();

    expect(before.items[0].revealed).toBe(false);
    expect(before.items[0].placements[0].finalScore).toBeNull();

    mocks.db.current = fakeDatabase({
      ...recorded(),
      hackathon_state: recorded().hackathon_state.map((state) =>
        state["slug"] === undefined && String(state["contract_id"]).startsWith("CCQ7") ? { ...state, phase: 5 } : state,
      ),
    });

    const after = await (await listResults(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG))).json();

    expect(after.items[0].revealed).toBe(true);
    expect(after.items[0].placements[0].finalScore).toBe(8_000);
  });
});
