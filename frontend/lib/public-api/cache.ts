/**
 * How long an answer may be reused, decided by what it is about rather than by
 * the route it came from.
 *
 * A public read-only API is read by dashboards on a schedule, and the cheapest
 * thing this product can do for its own database is let a CDN answer most of
 * those requests. What it must not do is cache something that changes the
 * moment somebody is waiting for it.
 *
 * So the policy follows the phase: an event that has settled will never change
 * again and can be cached for an hour, while an event mid judging changes every
 * few minutes and is cached for seconds. `stale-while-revalidate` on top, so a
 * consumer never waits on our revalidation.
 *
 * `next.config.ts` carries the same policy as a header rule for the route
 * prefix, which is what applies when a route answers from the edge without
 * running. The two agree by construction: the config imports this module.
 */

/** Phases 7 and 8 are settlement and completed: nothing about them changes again. */
const SETTLED_FROM = 7;

export const CACHE = {
  /** A listing changes whenever an event is created or moves phase. */
  listing: "public, max-age=30, stale-while-revalidate=120",
  /** One event mid flight. */
  live: "public, max-age=15, stale-while-revalidate=60",
  /** One event that has finished. */
  settled: "public, max-age=3600, stale-while-revalidate=86400",
  /** Anything that could not be answered, and the document itself. */
  none: "no-store",
  document: "public, max-age=300, stale-while-revalidate=3600",
} as const;

export function cacheFor(phase: number | null): string {
  if (phase === null) {
    return CACHE.none;
  }

  return phase >= SETTLED_FROM ? CACHE.settled : CACHE.live;
}

/** The header rule `next.config.ts` installs for the whole prefix. */
export const EDGE_CACHE_HEADER = {
  key: "cache-control",
  value: CACHE.listing,
} as const;
