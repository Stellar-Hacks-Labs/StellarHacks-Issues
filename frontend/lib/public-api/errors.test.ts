import { describe, it, expect } from 'vitest';
import { badRequest, notFound, tooManyRequests, serverError } from './errors';

describe('standardized errors', () => {
  it('badRequest returns 400 with code BAD_REQUEST', async () => {
    const res = badRequest('Invalid slug');
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid slug');
    expect(json.code).toBe('BAD_REQUEST');
  });

  it('notFound returns 404 with code NOT_FOUND', async () => {
    const res = notFound('Hackathon does not exist');
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Hackathon does not exist');
    expect(json.code).toBe('NOT_FOUND');
  });

  it('tooManyRequests sets 429 status and mandatory Retry-After header', async () => {
    const res = tooManyRequests(30, 'Rate limit exceeded');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
    const json = await res.json();
    expect(json.code).toBe('RATE_LIMITED');
    expect(json.details?.retryAfterSeconds).toBe(30);
  });

  it('serverError returns 500 status', async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('INTERNAL_ERROR');
  });
});
