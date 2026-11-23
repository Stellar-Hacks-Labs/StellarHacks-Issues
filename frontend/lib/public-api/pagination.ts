import type { PaginatedResponse, PaginationMeta } from './schemas';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

export interface PaginationParams {
  page: number;
  perPage: number;
}

/**
 * Extracts and clamps page and perPage parameters from a request URL or query.
 */
export function parsePagination(urlOrSearch: string | URL): PaginationParams {
  let searchParams: URLSearchParams;
  if (typeof urlOrSearch === 'string') {
    if (urlOrSearch.includes('?')) {
      searchParams = new URL(urlOrSearch, 'http://localhost').searchParams;
    } else {
      searchParams = new URLSearchParams(urlOrSearch);
    }
  } else {
    searchParams = urlOrSearch.searchParams;
  }

  const rawPage = parseInt(searchParams.get('page') || '', 10);
  const rawPerPage = parseInt(searchParams.get('per_page') || searchParams.get('limit') || '', 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  let perPage = Number.isInteger(rawPerPage) && rawPerPage > 0 ? rawPerPage : DEFAULT_PER_PAGE;

  if (perPage > MAX_PER_PAGE) {
    perPage = MAX_PER_PAGE;
  }

  return { page, perPage };
}

/**
 * Slices an array in-memory and builds standardized pagination metadata.
 */
export function paginate<T>(items: T[], page: number, perPage: number): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));

  const offset = (safePage - 1) * perPage;
  const data = items.slice(offset, offset + perPage);

  const pagination: PaginationMeta = {
    total,
    page: safePage,
    perPage,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };

  return { data, pagination };
}
