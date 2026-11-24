import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, CONSTITUTION_HASH, fakeDatabase, LIVE_SLUG, SETTLED_SLUG } from "./fixtures";
import { resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));

const { GET } = await import("../../app/api/v1/hackathons/[slug]/route");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

describe("one hackathon", () => {
  it("matches its published schema and carries the digest of its frozen rules", async () => {
    const response = await GET(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(validate(schemaFor("getHackathon"), body)).toEqual([]);
    /* The one field on this route that matters: it is what lets a reader
       rebuild the rules from the public page and compare. Served as plain hex,
       with the `\x` PostgREST prefix gone. */
    expect(body.constitutionHash).toBe(CONSTITUTION_HASH);
  });

  it("counts teams and submissions from the derived tables", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG))).json();

    expect(body).toMatchObject({ teams: 3, submissions: 3 });
  });

  it("answers 404 for a slug nobody published", async () => {
    const response = await GET(asking("/hackathons/not-a-thing"), params("not-a-thing"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("not_found");
    expect(validate(schemaFor("error"), body)).toEqual([]);
  });

  it("caches a settled event for far longer than a running one", async () => {
    const live = await GET(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG));
    const settled = await GET(asking(`/hackathons/${SETTLED_SLUG}`), params(SETTLED_SLUG));
    const seconds = (response: Response) =>
      Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") ?? "")?.[1] ?? 0);

    expect(seconds(settled)).toBeGreaterThan(seconds(live));
  });

  it("serves an event the indexer has not caught up with, with unknowns as null", async () => {
    const rows = fakeDatabase({
      ...(await import("./fixtures")).recorded(),
      hackathon_state: [],
    });

    mocks.db.current = rows;

    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG))).json();

    /* Phase zero is the contract's draft, which is what an unindexed event is
       indistinguishable from here; the rules digest is honestly null rather
       than an empty string that would hash to something. */
    expect(body).toMatchObject({ phase: 0, phaseName: "Draft", constitutionHash: null, organizer: null });
    expect(validate(schemaFor("getHackathon"), body)).toEqual([]);
  });
});
