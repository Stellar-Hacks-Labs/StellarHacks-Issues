/**
 * The words somebody typed, turned into the terms the index is asked for.
 *
 * Punctuation is dropped and the terms are lower cased before anything is
 * matched, so a query and a title that differ only by a comma still meet.
 * An empty box is an empty term list, which means "do not filter by text"
 * rather than "match nothing": a reader who has only chosen a country still
 * gets that country.
 */
export function termsOf(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

export function matchesText(title: string, body: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = `${title} ${body}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
