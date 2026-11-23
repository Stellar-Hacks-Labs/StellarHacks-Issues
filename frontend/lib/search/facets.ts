import type { SearchDocument } from "./read";

/**
 * Counts taken from the rows that are actually on the page's result set.
 *
 * A count computed from the whole catalogue would advertise a phase that the
 * current text query has already excluded. The reader would open it and find
 * nothing, which is the count lying.
 */
export type FacetGroup = { name: "phase" | "prizeAsset" | "tag" | "country"; options: { value: string; count: number }[] };

function counts(documents: SearchDocument[], valueOf: (document: SearchDocument) => string[]): { value: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const document of documents) {
    for (const value of valueOf(document)) {
      if (value === "") continue;
      tally.set(value, (tally.get(value) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function facetsOf(documents: SearchDocument[]): FacetGroup[] {
  return [
    { name: "phase", options: counts(documents, (document) => [document.phase]) },
    { name: "prizeAsset", options: counts(documents, (document) => [document.prizeAsset]) },
    { name: "tag", options: counts(documents, (document) => document.tags) },
    { name: "country", options: counts(documents, (document) => [document.country]) },
  ];
}
