/**
 * Inclusive ledger ranges, and the arithmetic the gap and re-ingest paths share.
 *
 * Ledgers are counted as closed sequence numbers. A range is inclusive on both
 * ends so that a single ledger is `{ from: n, to: n }` rather than an empty
 * half-open interval, which is the shape operators write when they point at a
 * hole.
 */

export interface LedgerRange {
  from: number;
  to: number;
}

/** Inclusive width. An inverted range has width zero rather than a negative. */
export function width(range: LedgerRange): number {
  return range.to < range.from ? 0 : range.to - range.from + 1;
}

/**
 * Puts the smaller bound first.
 *
 * Callers paste ledger numbers off explorers and sometimes reverse them. The
 * rest of this package refuses to guess which end was meant, so normalisation
 * happens once, here.
 */
export function normalize(from: number, to: number): LedgerRange {
  return from <= to ? { from, to } : { from: to, to: from };
}

/** Whether two inclusive ranges share at least one ledger. */
export function overlaps(a: LedgerRange, b: LedgerRange): boolean {
  return a.from <= b.to && b.from <= a.to;
}

/**
 * Merges overlapping or abutting ranges into a sorted cover.
 *
 * Abutting ranges (`1-3` and `4-6`) become one, because a re-ingest that asks
 * for both is one contiguous scan and a gap detector that left a seam between
 * them would invent a hole nobody missed.
 */
export function merge(ranges: readonly LedgerRange[]): LedgerRange[] {
  const sorted = [...ranges]
    .filter((range) => range.to >= range.from)
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const out: LedgerRange[] = [];

  for (const range of sorted) {
    const last = out[out.length - 1];

    if (last === undefined) {
      out.push({ ...range });
      continue;
    }

    if (range.from <= last.to + 1) {
      last.to = Math.max(last.to, range.to);
      continue;
    }

    out.push({ ...range });
  }

  return out;
}

/**
 * Every inclusive hole inside `span` that the cover does not touch.
 *
 * The cover is what was actually scanned. The span is what the cursor claims.
 * Their difference is the set of ledgers nobody looked at, which is the only
 * definition of a gap that does not confuse "no events in this ledger" with
 * "this ledger was never requested".
 */
export function holes(span: LedgerRange, cover: readonly LedgerRange[]): LedgerRange[] {
  if (span.to < span.from) {
    return [];
  }

  const merged = merge(cover.filter((range) => overlaps(range, span)));
  const gaps: LedgerRange[] = [];
  let cursor = span.from;

  for (const range of merged) {
    const start = Math.max(range.from, span.from);
    const end = Math.min(range.to, span.to);

    if (start > cursor) {
      gaps.push({ from: cursor, to: start - 1 });
    }

    cursor = Math.max(cursor, end + 1);
  }

  if (cursor <= span.to) {
    gaps.push({ from: cursor, to: span.to });
  }

  return gaps;
}

/**
 * Cuts a range down to what an RPC node still serves.
 *
 * Asking for a ledger older than `oldest` is the failure that cannot be walked
 * off; asking for one newer than `latest` is asking for the future. Both ends
 * are clamped rather than refused so a re-ingest of a pasted range still does
 * the useful middle.
 */
export function clampToRetention(
  range: LedgerRange,
  oldest: number,
  latest: number,
): LedgerRange | null {
  const from = Math.max(range.from, oldest);
  const to = Math.min(range.to, latest);

  return to < from ? null : { from, to };
}

/**
 * Splits a range into pages no wider than `maxWidth`.
 *
 * Re-ingest is bounded on purpose: one call that asks for a hundred thousand
 * ledgers would hold the process and the RPC node for longer than an operator
 * watching a terminal expects. Page by page is slower and interruptible.
 */
export function paginate(range: LedgerRange, maxWidth: number): LedgerRange[] {
  if (maxWidth <= 0 || range.to < range.from) {
    return [];
  }

  const pages: LedgerRange[] = [];
  let from = range.from;

  while (from <= range.to) {
    const to = Math.min(from + maxWidth - 1, range.to);
    pages.push({ from, to });
    from = to + 1;
  }

  return pages;
}
