import { beforeEach, describe, expect, it, vi } from "vitest";

import { asking, fakeDatabase, LIVE_SLUG, SETTLED_SLUG } from "./fixtures";
import { operations, resetRateLimits, schemaFor, validate } from "../../lib/public-api";

const mocks = vi.hoisted(() => ({ db: { current: null as unknown } }));

vi.mock("../../lib/supabase/server", () => ({ serverClient: async () => mocks.db.current }));
vi.mock("../../lib/roots", () => ({ rootsOf: async () => ({ scores: "11".repeat(32), ballots: null }) }));

const listHackathons = (await import("../../app/api/v1/hackathons/route")).GET;
const getHackathon = (await import("../../app/api/v1/hackathons/[slug]/route")).GET;
const listProjects = (await import("../../app/api/v1/hackathons/[slug]/projects/route")).GET;
const listResults = (await import("../../app/api/v1/hackathons/[slug]/results/route")).GET;
const getProof = (await import("../../app/api/v1/hackathons/[slug]/proof/route")).GET;
const getDocument = (await import("../../app/api/v1/openapi.json/route")).GET;

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  resetRateLimits();
  mocks.db.current = fakeDatabase();
});

/**
 * The document and the answers, held together.
 *
 * This is the suite the API's central claim rests on: every operation the
 * document declares is called, and its real response is validated against the
 * schema the document publishes for it. A field renamed in a route, a column
 * forwarded by accident, or a schema edited without the code fails here rather
 * than at a consumer.
 *
 * Both halves of each operation are checked — the success and a failure —
 * because an API whose errors are undocumented is an API whose consumers guess.
 */

describe("every operation the document declares", () => {
  it("is one this suite calls", () => {
    expect(operations().map((operation) => operation.operationId).sort()).toEqual([
      "getHackathon",
      "getOpenApiDocument",
      "getProof",
      "listHackathons",
      "listProjects",
      "listResults",
    ]);
  });

  it("answers within its published schema", async () => {
    const answers: [string, Response][] = [
      ["listHackathons", await listHackathons(asking("/hackathons"))],
      ["getHackathon", await getHackathon(asking(`/hackathons/${LIVE_SLUG}`), params(LIVE_SLUG))],
      ["listProjects", await listProjects(asking(`/hackathons/${LIVE_SLUG}/projects`), params(LIVE_SLUG))],
      ["listResults", await listResults(asking(`/hackathons/${SETTLED_SLUG}/results`), params(SETTLED_SLUG))],
      ["getProof", await getProof(asking(`/hackathons/${SETTLED_SLUG}/proof`), params(SETTLED_SLUG))],
    ];

    for (const [operation, response] of answers) {
      expect(response.status, operation).toBe(200);
      expect(validate(schemaFor(operation), await response.json()), operation).toEqual([]);
    }
  });

  it("answers its failures within the published error schema", async () => {
    const failures: [string, Response][] = [
      ["not found", await getHackathon(asking("/hackathons/nope"), params("nope"))],
      ["bad limit", await listHackathons(asking("/hackathons?limit=0"))],
      ["bad cursor", await listHackathons(asking("/hackathons?cursor=nope"))],
      ["projects not found", await listProjects(asking("/hackathons/nope/projects"), params("nope"))],
      ["results not found", await listResults(asking("/hackathons/nope/results"), params("nope"))],
      ["proof not found", await getProof(asking("/hackathons/nope/proof"), params("nope"))],
    ];

    for (const [what, response] of failures) {
      expect(response.status, what).toBeGreaterThanOrEqual(400);
      expect(validate(schemaFor("error"), await response.json()), what).toEqual([]);
    }
  });
});

describe("the document the API serves", () => {
  it("is the document the code composes, at this deployment's own origin", async () => {
    const response = await getDocument(asking("/openapi.json"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openapi).toBe("3.1.0");
    expect(body.servers[0].url).toBe("http://localhost/api/v1");
    expect(response.headers.get("cache-control")).toContain("max-age");
  });

  it("declares a schema for every response the routes actually return", async () => {
    const body = await (await getDocument(asking("/openapi.json"))).json();
    const components = Object.keys(body.components.schemas);

    expect(components).toEqual(
      expect.arrayContaining(["HackathonSummary", "Hackathon", "Project", "TrackResult", "Proof", "Error"]),
    );
  });

  it("is rate limited like every other route", async () => {
    const response = await getDocument(asking("/openapi.json"));

    expect(response.headers.get("ratelimit-limit")).not.toBeNull();
  });
});
