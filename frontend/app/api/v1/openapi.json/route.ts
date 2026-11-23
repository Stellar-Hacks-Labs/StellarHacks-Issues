import { OPENAPI_SPEC } from '../../../../lib/public-api/openapi';
import { getCacheHeaders } from '../../../../lib/public-api/cache';

export async function GET() {
  return Response.json(OPENAPI_SPEC, {
    status: 200,
    headers: {
      ...getCacheHeaders(),
      'Content-Type': 'application/json',
    },
  });
}
