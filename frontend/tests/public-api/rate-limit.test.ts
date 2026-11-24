import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG } from "./fixtures";
import { LIMIT_PER_WINDOW, resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));
vi.mock("../../lib/roots", () => ({ rootsOf: async () => ({ scores: null, ballots: null }) }));

const listHackathons = (await import("../../app/api/v1/hackathons/route")).GET;
const getHackathon = (await import("../../app/api/v1/hackathons/[slug]/route")).GET;
const getDocument = (await import("../../app/api/v1/openapi.json/route")).GET;

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

/**
 * What a client is allowed, and how it is told — through the routes rather than
 * through the limiter.
 *
 * The limiter's own arithmetic is covered in `lib/public-api/rate-limit.test.ts`.
 * What is proved here is that every route opens with it, that a refusal is a
 * documented error rather than a bare status, and that one noisy client cannot
 * spend another's budget.
 */

describe("a client inside its budget", () => {
  it("is told what is left on every answer", async () => {
    const first = await listHackathons(asking("/hackathons", "a-client"));
    const second = await listHackathons(asking("/hackathons", "a-client"));

    expect(first.headers.get("ratelimit-remaining")).toBe(String(LIMIT_PER_WINDOW - 1));
    expect(second.headers.get("ratelimit-remaining")).toBe(String(LIMIT_PER_WINDOW - 2));
  });
});

describe("a client over it", () => {
  it("is refused with 429, a retry header and the shared error shape", async () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      await listHackathons(asking("/hackathons", "noisy"));
    }

    const refused = await listHackathons(asking("/hackathons", "noisy"));
    const body = await refused.json();

    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).not.toBeNull();
    expect(refused.headers.get("ratelimit-remaining")).toBe("0");
    expect(body.error.code).toBe("rate_limited");
    expect(validate(schemaFor("error"), body)).toEqual([]);
  });

  it("is refused before the route reads anything", async () => {
    mocks.db.current = null;

    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      await listHackathons(asking("/hackathons", "early"));
    }

    /* With no database configured an allowed request answers 503. The refusal
       is 429 instead, which is how the order is pinned: the gate opens first,
       so a client over its budget cannot make the deployment do work. */
    const refused = await listHackathons(asking("/hackathons", "early"));

    expect(refused.status).toBe(429);
  });

  it("does not spend another client's budget", async () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      await listHackathons(asking("/hackathons", "loud"));
    }

    expect((await listHackathons(asking("/hackathons", "loud"))).status).toBe(429);
    expect((await listHackathons(asking("/hackathons", "polite"))).status).toBe(200);
  });
});

describe("every route", () => {
  it("opens with the gate, including the document", async () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      await getDocument(asking("/openapi.json", "everywhere"));
    }

    expect((await getDocument(asking("/openapi.json", "everywhere"))).status).toBe(429);
    expect((await getHackathon(asking(`/hackathons/${LIVE_SLUG}`, "everywhere"), params(LIVE_SLUG))).status).toBe(429);
  });

  it("counts a client across routes, because the budget is for the deployment", async () => {
    for (let at = 0; at < LIMIT_PER_WINDOW - 1; at += 1) {
      await listHackathons(asking("/hackathons", "mixed"));
    }

    expect((await getHackathon(asking(`/hackathons/${LIVE_SLUG}`, "mixed"), params(LIVE_SLUG))).status).toBe(200);
    expect((await getHackathon(asking(`/hackathons/${LIVE_SLUG}`, "mixed"), params(LIVE_SLUG))).status).toBe(429);
  });
});
