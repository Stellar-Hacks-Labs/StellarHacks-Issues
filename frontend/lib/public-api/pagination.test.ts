import { describe, it, expect } from 'vitest';
import { parsePagination, paginate, DEFAULT_PAGE, DEFAULT_PER_PAGE, MAX_PER_PAGE } from './pagination';

describe('pagination defense', () => {
  it('defaults to page 1 and perPage 20 when query parameters are missing or invalid', () => {
    expect(parsePagination('http://localhost/api/v1/hackathons')).toEqual({
      page: DEFAULT_PAGE,
      perPage: DEFAULT_PER_PAGE,
    });

    expect(parsePagination('http://localhost/api/v1/hackathons?page=-5&limit=abc')).toEqual({
      page: DEFAULT_PAGE,
      perPage: DEFAULT_PER_PAGE,
    });
  });

  it('caps perPage to MAX_PER_PAGE (100) to prevent denial of service', () => {
    const parsed = parsePagination('http://localhost/api/v1/hackathons?page=2&per_page=999');
    expect(parsed.page).toBe(2);
    expect(parsed.perPage).toBe(MAX_PER_PAGE);
  });

  it('correctly calculates offsets, totalPages, hasNext, and hasPrev', () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 }));

    // Page 1
    const p1 = paginate(items, 1, 20);
    expect(p1.data).toHaveLength(20);
    expect(p1.pagination.total).toBe(45);
    expect(p1.pagination.totalPages).toBe(3);
    expect(p1.pagination.hasNext).toBe(true);
    expect(p1.pagination.hasPrev).toBe(false);

    // Page 3 (last page)
    const p3 = paginate(items, 3, 20);
    expect(p3.data).toHaveLength(5);
    expect(p3.pagination.hasNext).toBe(false);
    expect(p3.pagination.hasPrev).toBe(true);
  });
});
