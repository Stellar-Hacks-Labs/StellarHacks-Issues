import { describe, expect, it } from "vitest";

import { CACHE } from "./cache";
import { API_ERRORS } from "./errors";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./pagination";
import { LIMIT_PER_WINDOW } from "./rate-limit";
import { API_VERSION, openApiDocument, operations, schemaFor } from "./openapi";

/**
 * The document, and that it says what the code does.
 *
 * Every claim this API makes about itself is in here, so the tests worth having
 * are the ones that would catch the document drifting from the modules it is
 * built from: a limit changed in one place, an error code added without a
 * documented response, a schema that stopped being referenced.
 */

const document = openApiDocument("https://example.test");

describe("the document", () => {
  it("declares the version this API is served under", () => {
    expect(document["openapi"]).toBe("3.1.0");
    expect((document["info"] as Record<string, unknown>)["version"]).toBe(API_VERSION);
    expect(document["servers"]).toEqual([
      { url: `https://example.test/api/${API_VERSION}`, description: "This deployment" },
    ]);
  });

  it("describes every route this API actually serves, and nothing it does not", () => {
    expect(Object.keys(document["paths"] as object).sort()).toEqual([
      "/hackathons",
      "/hackathons/{slug}",
      "/hackathons/{slug}/projects",
      "/hackathons/{slug}/proof",
      "/hackathons/{slug}/results",
      "/openapi.json",
    ]);
  });

  it("gives every operation an id, which is what a generated client is named from", () => {
    const ids = operations().map((operation) => operation.operationId);

    expect(ids).toEqual([
      "listHackathons",
      "getHackathon",
      "listProjects",
      "listResults",
      "getProof",
      "getOpenApiDocument",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("takes its paging bounds from the module that enforces them", () => {
    const parameters = ((document["paths"] as Record<string, Record<string, { parameters?: { name: string; schema?: Record<string, unknown> }[] }>>)[
      "/hackathons"
    ]!.get!.parameters ?? []) as { name: string; schema?: Record<string, unknown> }[];
    const limit = parameters.find((parameter) => parameter.name === "limit");

    expect(limit?.schema).toMatchObject({ maximum: MAX_LIMIT, default: DEFAULT_LIMIT });
  });

  it("states the rate limit it actually applies", () => {
    expect(String((document["info"] as Record<string, unknown>)["description"])).toContain(
      `${LIMIT_PER_WINDOW} requests`,
    );
  });

  it("publishes the cache policy the routes send", () => {
    expect(document["x-caching"]).toMatchObject({
      listing: CACHE.listing,
      liveEvent: CACHE.live,
      settledEvent: CACHE.settled,
      document: CACHE.document,
    });
  });

  it("documents a response for every error code the catalogue can produce", () => {
    const statuses = new Set<string>();
    const paths = document["paths"] as Record<string, Record<string, { responses: Record<string, unknown> }>>;

    for (const methods of Object.values(paths)) {
      for (const operation of Object.values(methods)) {
        for (const status of Object.keys(operation.responses)) {
          statuses.add(status);
        }
      }
    }

    for (const [code, { status }] of Object.entries(API_ERRORS)) {
      /* `invalid_cursor` shares 400 with `invalid_request`, which is the point
         of pairing a status with each code in one place. */
      expect(statuses.has(String(status)), code).toBe(true);
    }
  });

  it("references a schema for every component it declares, and declares one for every reference", () => {
    const components = (document["components"] as Record<string, Record<string, unknown>>)["schemas"] ?? {};
    const text = JSON.stringify(document["paths"]);

    for (const name of Object.keys(components)) {
      expect(text, name).toContain(`#/components/schemas/${name}`);
    }

    for (const reference of text.match(/#\/components\/schemas\/(\w+)/g) ?? []) {
      expect(Object.keys(components)).toContain(reference.split("/").pop());
    }
  });

  it("says the two things it never serves", () => {
    const description = String((document["info"] as Record<string, unknown>)["description"]);

    expect(description).toContain("a score before its event's reveal");
    expect(description).toContain("private profile field");
  });

  it("says there are no write endpoints and no API keys", () => {
    const description = String((document["info"] as Record<string, unknown>)["description"]);

    expect(description).toContain("no write endpoints and no API keys");
  });
});

describe("the schema a response must match", () => {
  it("is published for every operation that returns a body", () => {
    for (const operation of ["listHackathons", "getHackathon", "listProjects", "listResults", "getProof", "error"]) {
      expect(schemaFor(operation).type, operation).toBe("object");
    }
  });

  it("refuses to invent one for an operation nobody declared", () => {
    expect(() => schemaFor("deleteEverything")).toThrowError(/no schema is published/);
  });
});
