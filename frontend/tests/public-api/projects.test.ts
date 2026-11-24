import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG } from "./fixtures";
import { privateFieldsIn, resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));

const { GET } = await import("../../app/api/v1/hackathons/[slug]/projects/route");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

describe("the projects of one hackathon", () => {
  it("matches its published schema, in team order", async () => {
    const response = await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(validate(schemaFor("listProjects"), body)).toEqual([]);
    expect(body.items.map((item: { team: number }) => item.team)).toEqual([1, 2, 3]);
  });

  it("joins the submission record, which stays public at every visibility", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG))).json();

    expect(body.items[0]).toMatchObject({
      title: "A project",
      track: "ai",
      submissionDigest: "11".repeat(32),
    });
  });

  it("reports a disqualified entry as a flag and nothing more", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG))).json();
    const disqualified = body.items.filter((item: { disqualified: boolean }) => item.disqualified);

    // The reason is the organizer's to publish; a field here would be this API
    // paraphrasing a decision it did not make.
    expect(disqualified.map((item: { team: number }) => item.team)).toEqual([3]);
    expect(Object.keys(disqualified[0])).not.toContain("reason");
  });

  it("names an entry with no write up rather than leaving it out", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG))).json();

    /* Team 3 submitted and never wrote a project page. The entry is the
       contract's record and the gallery text is ours, so the row stays and the
       title falls back to the team. */
    expect(body.items[2]).toMatchObject({ team: 3, title: "Team 3", summary: null });
  });

  it("serves no private field, whatever the project row happens to carry", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG))).json();

    // The recorded project row carries an owner email and a profile id, as a
    // real one does. Neither is in the published shape.
    expect(privateFieldsIn(body)).toEqual([]);
  });

  it("pages by team, with an opaque cursor", async () => {
    const first = await (await GET(asking(`/hackathons/${LIVE_SLUG}/projects?limit=2`), params(LIVE_SLUG))).json();

    expect(first.items.map((item: { team: number }) => item.team)).toEqual([1, 2]);

    const second = await (
      await GET(
        asking(`/hackathons/${LIVE_SLUG}/projects?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`),
        params(LIVE_SLUG),
      )
    ).json();

    expect(second.items.map((item: { team: number }) => item.team)).toEqual([3]);
    expect(second.nextCursor).toBeNull();
  });

  it("answers 404 for an event nobody published", async () => {
    const response = await GET(asking("/hackathons/nope/projects"), params("nope"));

    expect(response.status).toBe(404);
  });

  it("says a source could not be read rather than answering with no entries", async () => {
    mocks.db.current = fakeDatabase(undefined, "submissions");

    const response = await GET(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG));

    expect(response.status).toBe(503);
  });
});
