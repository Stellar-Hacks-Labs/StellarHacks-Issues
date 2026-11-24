import { CACHE } from "./cache";
import { API_ERRORS } from "./errors";
import { DEFAULT_LIMIT, MAX_LIMIT } from "./pagination";
import { LIMIT_PER_WINDOW, WINDOW_MS } from "./rate-limit";
import {
  errorSchema,
  hackathonSchema,
  hackathonSummarySchema,
  pageSchema,
  projectSchema,
  proofSchema,
  trackResultSchema,
  type JsonSchema,
} from "./schemas";

/**
 * The description of this API, built from the same schemas the API answers
 * with.
 *
 * Composed rather than written. A document maintained beside the code is a
 * document that is wrong within a month, and a wrong document is worse than
 * none: a consumer can discover an undocumented API, but cannot discover that
 * the document lied. Everything below is assembled from `schemas.ts`,
 * `errors.ts`, `pagination.ts`, `rate-limit.ts` and `cache.ts`, so changing a
 * limit or a field changes the document in the same commit.
 *
 * `frontend/tests/public-api/contract.test.ts` closes the loop from the other
 * side: every response this API produces is validated against the document
 * served here, so a field that stops matching fails a test rather than a
 * consumer.
 */

export const API_VERSION = "v1";

const RESPONSES = {
  error: (code: keyof typeof API_ERRORS) => ({
    description: API_ERRORS[code].message,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  }),
};

function page(ref: string, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["items", "nextCursor"],
          properties: {
            items: { type: "array", items: { $ref: `#/components/schemas/${ref}` } },
            nextCursor: { type: ["string", "null"] },
          },
        },
      },
    },
  };
}

function one(ref: string, description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
  };
}

const PAGING_PARAMETERS = [
  {
    name: "limit",
    in: "query",
    required: false,
    description: `How many items to return. Between 1 and ${MAX_LIMIT}, default ${DEFAULT_LIMIT}.`,
    schema: { type: "integer", minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
  },
  {
    name: "cursor",
    in: "query",
    required: false,
    description:
      "The `nextCursor` from a previous page. Opaque: it is not a key and must not be constructed by a client.",
    schema: { type: "string" },
  },
];

const SLUG_PARAMETER = {
  name: "slug",
  in: "path",
  required: true,
  description: "The hackathon's slug, as published on its page.",
  schema: { type: "string" },
};

/** The document, as the API serves it. */
export function openApiDocument(origin = "https://stelhacks.app"): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: {
      title: "StelHacks read-only API",
      version: API_VERSION,
      summary: "Hackathons, projects, results and proofs, as the chain and the indexer recorded them.",
      description: [
        "A read-only view of what this platform published. There are no write endpoints and no API keys:",
        "everything here is already public, so there is nothing to authenticate and nothing an API key could",
        "protect.",
        "",
        `Rate limited to ${LIMIT_PER_WINDOW} requests per ${WINDOW_MS / 1000} seconds per client address.`,
        "Every answer carries `ratelimit-limit`, `ratelimit-remaining` and `ratelimit-reset`; a refusal carries",
        "`retry-after` as well.",
        "",
        "Two things are never served: a score before its event's reveal, and any private profile field.",
        "See `docs/public-api.md` for the versioning and deprecation promise.",
      ].join("\n"),
    },
    servers: [{ url: `${origin}/api/${API_VERSION}`, description: "This deployment" }],
    paths: {
      "/hackathons": {
        get: {
          operationId: "listHackathons",
          summary: "Every hackathon this platform knows of, newest first.",
          parameters: PAGING_PARAMETERS,
          responses: {
            "200": page("HackathonSummary", "A page of hackathons."),
            "400": RESPONSES.error("invalid_request"),
            "429": RESPONSES.error("rate_limited"),
            "503": RESPONSES.error("unavailable"),
          },
        },
      },
      "/hackathons/{slug}": {
        get: {
          operationId: "getHackathon",
          summary: "One hackathon, with the digest of its frozen rules.",
          parameters: [SLUG_PARAMETER],
          responses: {
            "200": one("Hackathon", "The hackathon."),
            "404": RESPONSES.error("not_found"),
            "429": RESPONSES.error("rate_limited"),
            "503": RESPONSES.error("unavailable"),
          },
        },
      },
      "/hackathons/{slug}/projects": {
        get: {
          operationId: "listProjects",
          summary: "The entries of one hackathon, as its public gallery shows them.",
          parameters: [SLUG_PARAMETER, ...PAGING_PARAMETERS],
          responses: {
            "200": page("Project", "A page of projects."),
            "400": RESPONSES.error("invalid_request"),
            "404": RESPONSES.error("not_found"),
            "429": RESPONSES.error("rate_limited"),
            "503": RESPONSES.error("unavailable"),
          },
        },
      },
      "/hackathons/{slug}/results": {
        get: {
          operationId: "listResults",
          summary: "The ranking by track. Scores are null until the event's reveal.",
          parameters: [SLUG_PARAMETER],
          responses: {
            "200": page("TrackResult", "One entry per track."),
            "404": RESPONSES.error("not_found"),
            "429": RESPONSES.error("rate_limited"),
            "503": RESPONSES.error("unavailable"),
          },
        },
      },
      "/hackathons/{slug}/proof": {
        get: {
          operationId: "getProof",
          summary: "What a reader needs to check the event without trusting this API.",
          parameters: [SLUG_PARAMETER],
          responses: {
            "200": one("Proof", "The digests, the roots and every payment out of the vault."),
            "404": RESPONSES.error("not_found"),
            "429": RESPONSES.error("rate_limited"),
            "503": RESPONSES.error("unavailable"),
          },
        },
      },
      "/openapi.json": {
        get: {
          operationId: "getOpenApiDocument",
          summary: "This document.",
          responses: { "200": { description: "The OpenAPI description of this API." } },
        },
      },
    },
    components: {
      schemas: {
        HackathonSummary: hackathonSummarySchema,
        Hackathon: hackathonSchema,
        Project: projectSchema,
        TrackResult: trackResultSchema,
        Proof: proofSchema,
        Error: errorSchema,
      },
      headers: {
        "ratelimit-limit": { description: "Requests allowed in the current window.", schema: { type: "integer" } },
        "ratelimit-remaining": { description: "Requests left in it.", schema: { type: "integer" } },
        "ratelimit-reset": { description: "Unix seconds the window resets at.", schema: { type: "integer" } },
        "retry-after": { description: "Seconds to wait, on a refusal.", schema: { type: "integer" } },
      },
    },
    "x-caching": {
      listing: CACHE.listing,
      liveEvent: CACHE.live,
      settledEvent: CACHE.settled,
      document: CACHE.document,
      note: "An event that has settled never changes again and is cached for an hour; one mid flight for seconds.",
    },
  };
}

/** The schema a response of this operation must match, for the contract tests. */
export function schemaFor(operation: string): JsonSchema {
  switch (operation) {
    case "listHackathons":
      return pageSchema(hackathonSummarySchema, "A page of hackathons.");
    case "getHackathon":
      return hackathonSchema;
    case "listProjects":
      return pageSchema(projectSchema, "A page of projects.");
    case "listResults":
      return pageSchema(trackResultSchema, "One entry per track.");
    case "getProof":
      return proofSchema;
    case "error":
      return errorSchema;
    default:
      throw new Error(`no schema is published for ${operation}`);
  }
}

/** Every operation the document declares, which is what the contract test walks. */
export function operations(): { operationId: string; path: string; method: string }[] {
  const document = openApiDocument();
  const paths = document["paths"] as Record<string, Record<string, { operationId?: string }>>;

  return Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      operationId: String(operation.operationId),
      path,
      method,
    })),
  );
}
