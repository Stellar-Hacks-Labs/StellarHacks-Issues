import { describe, it, expect } from 'vitest';
import {
  generateETag,
  isNotModified,
  getCacheHeaders,
  PUBLIC_API_CACHE_CONTROL,
} from './cache';

describe('cache headers & etags', () => {
  it('generates consistent ETags for identical content', () => {
    const data1 = { a: 1, b: 'two' };
    const data2 = { a: 1, b: 'two' };
    const etag1 = generateETag(data1);
    const etag2 = generateETag(data2);

    expect(etag1).toBe(etag2);
    expect(etag1.startsWith('W/"')).toBe(true);
  });

  it('detects If-None-Match matching computed ETag', () => {
    const etag = 'W/"abc123-10"';
    const reqMatch = new Request('http://localhost', {
      headers: { 'if-none-match': etag },
    });
    expect(isNotModified(reqMatch, etag)).toBe(true);

    const reqMismatch = new Request('http://localhost', {
      headers: { 'if-none-match': 'W/"other"' },
    });
    expect(isNotModified(reqMismatch, etag)).toBe(false);
  });

  it('provides Cache-Control with stale-while-revalidate', () => {
    const headers = getCacheHeaders('W/"xyz"');
    expect(headers['Cache-Control']).toBe(PUBLIC_API_CACHE_CONTROL);
    expect(headers['ETag']).toBe('W/"xyz"');
  });
});
