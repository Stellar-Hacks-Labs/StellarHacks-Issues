import { errorResponse } from "./errors";

/**
 * How much of this API one client may read, and how it is told.
 *
 * The limit exists because the routes behind it read a database and, for the
 * proof route, the chain. A dashboard polling every second is not malicious and
 * should not have to guess what it is allowed: every answer carries the limit,
 * what is left and when the window resets, and a refusal carries `Retry-After`.
 * A limiter that only says no teaches a client to retry blindly.
 *
 * Per client address, as the issue asks. Behind a proxy that is the first entry
 * of `x-forwarded-for`; the header is spoofable, which is why this is a
 * fairness measure for ordinary consumers and not a security control. Nothing
 * behind it is private, so there is nothing for a spoofed client key to reach.
 *
 * In memory, which means per instance. A serverless deployment running four
 * copies allows four windows, and that is written down here rather than
 * pretended otherwise: the alternative is a shared store on the read path of
 * every public request.
 */

export const WINDOW_MS = 60_000;
export const LIMIT_PER_WINDOW = 60;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = globalThis as typeof globalThis & {
  __stelhacksPublicApiRate?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  buckets.__stelhacksPublicApiRate ??= new Map();

  return buckets.__stelhacksPublicApiRate;
}

export function clientOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();

  return forwarded || real || "local";
}

export interface RateDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix seconds the window resets at, which is what the header carries. */
  resetAt: number;
  retryAfterSeconds: number;
}

export function take(client: string, now = Date.now(), limit = LIMIT_PER_WINDOW): RateDecision {
  const held = store().get(client);

  if (held === undefined || held.resetAt <= now) {
    const resetAt = now + WINDOW_MS;

    store().set(client, { count: 1, resetAt });

    return { allowed: true, limit, remaining: limit - 1, resetAt: Math.ceil(resetAt / 1000), retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(Math.ceil((held.resetAt - now) / 1000), 1);

  if (held.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: Math.ceil(held.resetAt / 1000),
      retryAfterSeconds,
    };
  }

  held.count += 1;

  return {
    allowed: true,
    limit,
    remaining: Math.max(limit - held.count, 0),
    resetAt: Math.ceil(held.resetAt / 1000),
    retryAfterSeconds,
  };
}

/** The headers every answer carries, refusals included. */
export function rateHeaders(decision: RateDecision): Record<string, string> {
  return {
    "ratelimit-limit": String(decision.limit),
    "ratelimit-remaining": String(decision.remaining),
    "ratelimit-reset": String(decision.resetAt),
    ...(decision.allowed ? {} : { "retry-after": String(decision.retryAfterSeconds) }),
  };
}

/**
 * The gate every route opens with.
 *
 * Returns the refusal when there is one, so a route reads as "if refused,
 * answer that" and cannot forget to attach the headers to its own answer.
 */
export function guard(request: Request): { headers: Record<string, string>; refused: Response | null } {
  const decision = take(clientOf(request));
  const headers = rateHeaders(decision);

  return {
    headers,
    refused: decision.allowed ? null : errorResponse("rate_limited", undefined, headers),
  };
}

/** For tests, which must not inherit another test's window. */
export function resetRateLimits(): void {
  store().clear();
}
