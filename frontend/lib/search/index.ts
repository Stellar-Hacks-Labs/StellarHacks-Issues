import { facetsOf, type FacetGroup } from "./facets";
import { highlight } from "./highlight";
import { matchesText, termsOf } from "./query";
import { visibleTo, type Reader, type SearchDocument } from "./read";

export type { Reader, SearchDocument, Visibility } from "./read";
export type { FacetGroup } from "./facets";
export { anonymousReader, visibleTo } from "./read";
export { highlight, escapeHtml } from "./highlight";
export { termsOf } from "./query";
export { facetsOf } from "./facets";

export type SearchFilters = {
  q?: string;
  phase?: string;
  prizeAsset?: string;
  tag?: string;
  country?: string;
  page?: number;
};

export type SearchHit = SearchDocument & { titleHtml: string; snippetHtml: string };

export type SearchPage = {
  hits: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: FacetGroup[];
};

/** Twenty is enough to scan and small enough that one page stays one screen. */
export const PAGE_SIZE = 20;

/**
 * Search across the documents the reader is allowed to see.
 *
 * Visibility is applied before text and facets. A private project that matches
 * the words still does not exist for a reader who may not open it, and it does
 * not contribute to a facet count either.
 */
export function searchCatalog(documents: SearchDocument[], reader: Reader, filters: SearchFilters): SearchPage {
  const terms = termsOf(filters.q);
  const allowed = documents.filter((document) => visibleTo(document, reader));
  const matched = allowed.filter((document) => {
    if (!matchesText(document.title, document.body, terms)) return false;
    if (filters.phase && document.phase !== filters.phase) return false;
    if (filters.prizeAsset && document.prizeAsset !== filters.prizeAsset) return false;
    if (filters.tag && !document.tags.includes(filters.tag)) return false;
    if (filters.country && document.country !== filters.country) return false;
    return true;
  });
  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * PAGE_SIZE;
  const hits = matched.slice(start, start + PAGE_SIZE).map((document) => ({
    ...document,
    titleHtml: highlight(document.title, filters.q ?? ""),
    snippetHtml: highlight(document.body.slice(0, 180), filters.q ?? ""),
  }));
  return { hits, total: matched.length, page, pageSize: PAGE_SIZE, facets: facetsOf(matched) };
}
