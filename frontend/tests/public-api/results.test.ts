import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG, SETTLED_SLUG, TX_HASH } from "./fixtures";
import { resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));

const { GET } = await import("../../app/api/v1/hackathons/[slug]/results/route");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

describe("the ranking of an event that has revealed", () => {
  it("matches its published schema and carries the scores", async () => {
    const response = await GET(asking(`/hackathons/${SETTLED_SLUG}/results`), params(SETTLED_SLUG));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(validate(schemaFor("listResults"), body)).toEqual([]);
    expect(body.items[0]).toMatchObject({ track: "ai", revealed: true });
    expect(body.items[0].placements[0]).toMatchObject({ rank: 1, team: 1, finalScore: 9_000 });
  });

  it("names the payment that settled a placing", async () => {
    const body = await (await GET(asking(`/hackathons/${SETTLED_SLUG}/results`), params(SETTLED_SLUG))).json();

    expect(body.items[0].placements[0]).toMatchObject({ paidAmount: "3000", paidTxHash: TX_HASH });
  });
});

describe("the ranking of an event that has not", () => {
  it("serves the placings and no score at all", async () => {
    const response = await GET(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG));
    const body = await response.json();

    expect(validate(schemaFor("listResults"), body)).toEqual([]);
    expect(body.items[0].revealed).toBe(false);

    for (const placement of body.items[0].placements) {
      /* The contract ranks before the reveal, so the placing is public; the
         numbers behind it are sealed, and a zero here would read as a score
         rather than as an absence. */
      expect(placement.finalScore).toBeNull();
      expect(placement.judgeAverage).toBeNull();
      expect(placement.community).toBeNull();
      expect(placement.decidedBy).toBeNull();
    }

    expect(body.items[0].placements.map((placement: { rank: number }) => placement.rank)).toEqual([1, 2]);
  });

  it("holds no score anywhere in the serialized answer", async () => {
    const response = await GET(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG));
    const text = await response.text();

    // The recorded ranking has 8000, 7500, 6000 in it. None may appear.
    for (const score of ["8000", "7500", "6000", "500"]) {
      expect(text, score).not.toContain(score);
    }
  });
});

describe("the shape of the answer", () => {
  it("is the same page envelope as the lists, with nothing to page", async () => {
    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG))).json();

    // A hackathon has a handful of tracks. Paging it would make every consumer
    // write a loop that runs once.
    expect(body.nextCursor).toBeNull();
  });

  it("orders tracks and placings so a consumer does not have to", async () => {
    mocks.db.current = fakeDatabase({
      ...(await import("./fixtures")).recorded(),
      results: [
        { contract_id: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB", track: "tooling", rank: 2, team_id: 9 },
        { contract_id: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB", track: "ai", rank: 2, team_id: 1 },
        { contract_id: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB", track: "tooling", rank: 1, team_id: 8 },
        { contract_id: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB", track: "ai", rank: 1, team_id: 2 },
      ],
    });

    const body = await (await GET(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG))).json();

    expect(body.items.map((item: { track: string }) => item.track)).toEqual(["ai", "tooling"]);
    expect(body.items[0].placements.map((placement: { rank: number }) => placement.rank)).toEqual([1, 2]);
  });

  it("answers 404 for an event nobody published, and 503 when a source fails", async () => {
    expect((await GET(asking("/hackathons/nope/results"), params("nope"))).status).toBe(404);

    mocks.db.current = fakeDatabase(undefined, "results");
    expect((await GET(asking(`/hackathons/${LIVE_SLUG}/results`), params(LIVE_SLUG))).status).toBe(503);
  });
});
