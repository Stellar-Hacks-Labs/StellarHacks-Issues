import { describe, expect, it } from "vitest";

import { CACHE, EDGE_CACHE_HEADER, cacheFor } from "./cache";

describe("how long an answer may be reused", () => {
  it("follows the event's phase rather than the route it came from", () => {
    // Settlement and completed never change again; everything before them can.
    expect(cacheFor(7)).toBe(CACHE.settled);
    expect(cacheFor(8)).toBe(CACHE.settled);
    expect(cacheFor(4)).toBe(CACHE.live);
    expect(cacheFor(0)).toBe(CACHE.live);
  });

  it("refuses to cache an answer about an event it knows no phase for", () => {
    expect(cacheFor(null)).toBe(CACHE.none);
  });

  it("lets a consumer be served stale rather than wait on our revalidation", () => {
    for (const policy of [CACHE.listing, CACHE.live, CACHE.settled, CACHE.document]) {
      expect(policy).toContain("stale-while-revalidate");
      expect(policy.startsWith("public,")).toBe(true);
    }
    expect(CACHE.none).toBe("no-store");
  });

  it("caches a finished event for far longer than a running one", () => {
    const seconds = (policy: string) => Number(/max-age=(\d+)/.exec(policy)?.[1] ?? 0);

    expect(seconds(CACHE.settled)).toBeGreaterThan(seconds(CACHE.live) * 10);
  });

  it("hands the edge the same policy the listing sends, from one definition", () => {
    expect(EDGE_CACHE_HEADER).toEqual({ key: "cache-control", value: CACHE.listing });
  });
});
