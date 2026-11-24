import { CACHE, guard, openApiDocument } from "../../../../lib/public-api";

/**
 * This API's own description, served from the same schemas it answers with.
 *
 * Served rather than committed as a file so it cannot be stale: the document is
 * composed at request time from the modules that decide the shapes, the limits
 * and the cache policy, and `frontend/tests/public-api/contract.test.ts`
 * validates real responses against it. A document and an implementation that
 * can disagree eventually do.
 *
 * Rate limited like every other route. It is the cheapest answer here, and a
 * consumer fetching it in a loop is still a consumer worth slowing down.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { headers, refused } = guard(request);

  if (refused !== null) {
    return refused;
  }

  const origin = new URL(request.url).origin;

  return Response.json(openApiDocument(origin), {
    headers: { ...headers, "cache-control": CACHE.document },
  });
}
