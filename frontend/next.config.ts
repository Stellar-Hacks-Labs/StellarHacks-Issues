import type { NextConfig } from "next";

import { API_VERSION } from "./lib/public-api/openapi";
import { EDGE_CACHE_HEADER } from "./lib/public-api/cache";

/**
 * One header rule, for the public API's prefix.
 *
 * The routes set their own `cache-control` per answer, because how long an
 * answer may be reused depends on the event's phase — a settled hackathon never
 * changes again, one mid judging changes every few minutes. This rule is the
 * floor underneath that: it applies to anything served from the prefix without
 * a route having set one, so a new route cannot accidentally ship as
 * uncacheable and put every dashboard's polling straight onto the database.
 *
 * The value is imported rather than written here, so the config and the routes
 * cannot disagree about the policy.
 */

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: `/api/${API_VERSION}/:path*`,
        headers: [EDGE_CACHE_HEADER],
      },
    ];
  },
};

export default nextConfig;
