import { describe, expect, it } from "vitest";

import { API_ERRORS, errorBody, errorResponse } from "./errors";
import { errorSchema, validate } from "./schemas";

describe("the error catalogue", () => {
  it("pairs one status with each code, so a condition answers the same way everywhere", () => {
    expect(API_ERRORS.not_found.status).toBe(404);
    expect(API_ERRORS.invalid_request.status).toBe(400);
    expect(API_ERRORS.invalid_cursor.status).toBe(400);
    expect(API_ERRORS.rate_limited.status).toBe(429);
    /* 503 rather than 500: the API is fine and a source it reads is not, and a
       dashboard retrying on a schedule needs to tell those apart. */
    expect(API_ERRORS.unavailable.status).toBe(503);
  });

  it("says something a person reading a log can act on", () => {
    for (const [code, { message }] of Object.entries(API_ERRORS)) {
      expect(message.length, code).toBeGreaterThan(10);
      expect(message.endsWith("."), code).toBe(true);
    }
  });
});

describe("an error body", () => {
  it("matches the published schema, with and without a detail", () => {
    expect(validate(errorSchema, errorBody("not_found"))).toEqual([]);
    expect(validate(errorSchema, errorBody("invalid_request", "limit must be a whole number"))).toEqual([]);
  });

  it("carries the code a consumer branches on", () => {
    expect(errorBody("rate_limited").error.code).toBe("rate_limited");
  });

  it("leaves the detail out rather than sending null when there is none", () => {
    expect("detail" in errorBody("not_found").error).toBe(false);
  });
});

describe("an error response", () => {
  it("answers with the catalogue's status and JSON", async () => {
    const response = errorResponse("not_found");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual(errorBody("not_found"));
  });

  it("carries whatever headers the caller attached, which is how a refusal keeps its retry header", () => {
    const response = errorResponse("rate_limited", undefined, { "retry-after": "30" });

    expect(response.headers.get("retry-after")).toBe("30");
  });
});
