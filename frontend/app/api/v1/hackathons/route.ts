import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
} from '../../../../lib/public-api/rate-limit';
import { parsePagination } from '../../../../lib/public-api/pagination';
import { readHackathons } from '../../../../lib/public-api/read';
import {
  generateETag,
  isNotModified,
  getCacheHeaders,
} from '../../../../lib/public-api/cache';
import { tooManyRequests } from '../../../../lib/public-api/errors';

export async function GET(request: Request) {
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientIp);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return tooManyRequests(rateLimit.retryAfter, 'Rate limit exceeded', rateLimitHeaders);
  }

  const { page, perPage } = parsePagination(request.url);
  const paginated = await readHackathons(page, perPage);

  const etag = generateETag(paginated);
  if (isNotModified(request, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ...rateLimitHeaders,
        ...getCacheHeaders(etag),
      },
    });
  }

  return Response.json(paginated, {
    status: 200,
    headers: {
      ...rateLimitHeaders,
      ...getCacheHeaders(etag),
    },
  });
}
