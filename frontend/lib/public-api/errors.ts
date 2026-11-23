import type { PublicApiError } from './schemas';

export function badRequest(
  message = 'Bad Request',
  details?: unknown,
  extraHeaders?: HeadersInit
): Response {
  const body: PublicApiError = {
    error: message,
    code: 'BAD_REQUEST',
    status: 400,
    details,
  };
  return Response.json(body, {
    status: 400,
    headers: extraHeaders,
  });
}

export function notFound(
  message = 'Resource Not Found',
  extraHeaders?: HeadersInit
): Response {
  const body: PublicApiError = {
    error: message,
    code: 'NOT_FOUND',
    status: 404,
  };
  return Response.json(body, {
    status: 404,
    headers: extraHeaders,
  });
}

export function tooManyRequests(
  retryAfterSeconds: number,
  message = 'Too Many Requests',
  extraHeaders?: HeadersInit
): Response {
  const body: PublicApiError = {
    error: message,
    code: 'RATE_LIMITED',
    status: 429,
    details: { retryAfterSeconds },
  };

  const headers = new Headers(extraHeaders);
  headers.set('Retry-After', String(Math.max(1, retryAfterSeconds)));

  return Response.json(body, {
    status: 429,
    headers,
  });
}

export function serverError(
  message = 'Internal Server Error',
  extraHeaders?: HeadersInit
): Response {
  const body: PublicApiError = {
    error: message,
    code: 'INTERNAL_ERROR',
    status: 500,
  };
  return Response.json(body, {
    status: 500,
    headers: extraHeaders,
  });
}
