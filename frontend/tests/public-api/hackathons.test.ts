import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG, SETTLED_SLUG } from "./fixtures";
import { resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({
  serverClient: async () => mocks.db.current,
}));

const { GET } = await import("../../app/api/v1/hackathons/route");

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

describe("the hackathon listing", () => {
  it("answers newest first, matching its published schema", async () => {
    const response = await GET(asking("/hackathons"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(validate(schemaFor("listHackathons"), body)).toEqual([]);
    expect(body.items.map((item: { slug: string }) => item.slug)).toEqual([LIVE_SLUG, SETTLED_SLUG]);
  });

  it("names each event's phase in words as well as in the contract's numbering", async () => {
    const body = await (await GET(asking("/hackathons"))).json();

    expect(body.items[0]).toMatchObject({ phase: 4, phaseName: "Judging" });
    expect(body.items[1]).toMatchObject({ phase: 7, phaseName: "Settlement" });
  });

  it("pages with an opaque cursor, and ends with none", async () => {
    const first = await (await GET(asking("/hackathons?limit=1"))).json();

    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).not.toBeNull();

    const second = await (
      await GET(asking(`/hackathons?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`))
    ).json();

    expect(second.items.map((item: { slug: string }) => item.slug)).toEqual([SETTLED_SLUG]);
    expect(second.nextCursor).toBeNull();
  });

  it("refuses a limit it does not accept, with the shared error shape", async () => {
    const response = await GET(asking("/hackathons?limit=500"));

    expect(response.status).toBe(400);
    expect(validate(schemaFor("error"), await response.json())).toEqual([]);
  });

  it("refuses a cursor a client made up", async () => {
    const response = await GET(asking("/hackathons?cursor=tomorrow"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_cursor");
    expect(validate(schemaFor("error"), body)).toEqual([]);
  });

  it("carries the rate limit headers and a cache policy on every answer", async () => {
    const response = await GET(asking("/hackathons"));

    expect(response.headers.get("ratelimit-limit")).not.toBeNull();
    expect(response.headers.get("ratelimit-remaining")).not.toBeNull();
    expect(response.headers.get("ratelimit-reset")).not.toBeNull();
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate");
  });

  it("says a source could not be read rather than answering with an empty list", async () => {
    mocks.db.current = fakeDatabase(undefined, "hackathons");

    const response = await GET(asking("/hackathons"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("unavailable");
    expect(validate(schemaFor("error"), body)).toEqual([]);
  });

  it("says so when the deployment has no database at all", async () => {
    mocks.db.current = null;

    const response = await GET(asking("/hackathons"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "unavailable" } });
  });
});
