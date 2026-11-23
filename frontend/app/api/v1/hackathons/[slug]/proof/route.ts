import {
  checkRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
} from '../../../../../../lib/public-api/rate-limit';
import { readProofBySlug } from '../../../../../../lib/public-api/read';
import {
  generateETag,
  isNotModified,
  getCacheHeaders,
} from '../../../../../../lib/public-api/cache';
import { notFound, tooManyRequests } from '../../../../../../lib/public-api/errors';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const clientIp = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientIp);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return tooManyRequests(rateLimit.retryAfter, 'Rate limit exceeded', rateLimitHeaders);
  }

  const { slug } = await Promise.resolve(context.params);
  const proof = await readProofBySlug(slug);

  if (!proof) {
    return notFound(`Proof data for hackathon '${slug}' was not found`, rateLimitHeaders);
  }

  const etag = generateETag(proof);
  if (isNotModified(request, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ...rateLimitHeaders,
        ...getCacheHeaders(etag),
      },
    });
  }

  return Response.json(proof, {
    status: 200,
    headers: {
      ...rateLimitHeaders,
      ...getCacheHeaders(etag),
    },
  });
}
