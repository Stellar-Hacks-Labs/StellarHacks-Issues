export const PUBLIC_API_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/**
 * Computes a simple fast FNV-1a / DJB2 hash of string data for ETag generation.
 */
export function generateETag(payload: unknown): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `W/"${(hash >>> 0).toString(16)}-${str.length.toString(16)}"`;
}

/**
 * Checks If-None-Match header in request against computed ETag.
 */
export function isNotModified(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  if (!ifNoneMatch) return false;

  const clientEtags = ifNoneMatch.split(',').map((tag) => tag.trim());
  return clientEtags.includes(etag) || clientEtags.includes('*');
}

/**
 * Constructs standard caching headers including Cache-Control and ETag.
 */
export function getCacheHeaders(etag?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': PUBLIC_API_CACHE_CONTROL,
  };
  if (etag) {
    headers['ETag'] = etag;
  }
  return headers;
}
