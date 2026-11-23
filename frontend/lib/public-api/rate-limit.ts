export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until allowed
}

export const RATE_LIMIT_DEFAULT = 60; // 60 requests
export const RATE_LIMIT_WINDOW_MS = 60_000; // per 1 minute (60s)

interface ClientBucket {
  count: number;
  resetAt: number; // milliseconds
}

const memoryStore = new Map<string, ClientBucket>();

/**
 * Extracts client IP identifier from headers or fallback.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Checks whether an incoming request from an identifier is within rate limits.
 */
export function checkRateLimit(
  identifier: string,
  limit = RATE_LIMIT_DEFAULT,
  windowMs = RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  let bucket = memoryStore.get(identifier);

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + windowMs,
    };
    memoryStore.set(identifier, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const allowed = bucket.count <= limit;
  const resetSeconds = Math.ceil(bucket.resetAt / 1000);
  const retryAfter = allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed,
    limit,
    remaining,
    reset: resetSeconds,
    retryAfter,
  };
}

/**
 * Helper to construct documented rate limit headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Clears the memory store (primarily for unit tests).
 */
export function resetRateLimits(): void {
  memoryStore.clear();
}
