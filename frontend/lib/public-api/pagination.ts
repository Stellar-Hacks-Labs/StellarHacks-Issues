import { errorResponse } from "./errors";

/**
 * One way to page, shared by every list route.
 *
 * Cursor rather than offset. An offset over a list that grows while somebody
 * pages through it silently skips or repeats rows, and the lists here grow:
 * hackathons are created, projects are submitted. A cursor names the row the
 * next page starts after, so a page boundary stays where it was.
 *
 * The cursor is opaque on purpose — base64 of the key it encodes — because a
 * consumer that reads it will eventually construct one, and then the key is a
 * part of the contract nobody meant to promise. Opaque and validated: a cursor
 * that did not come from here is refused rather than coerced into a page.
 */

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

export interface PageRequest {
  limit: number;
  /** The key the next page starts after, decoded from the cursor. */
  after: string | null;
}

export type PageRequestResult = { ok: true; page: PageRequest } | { ok: false; response: Response };

export function readPageRequest(params: URLSearchParams): PageRequestResult {
  const asked = params.get("limit");
  let limit = DEFAULT_LIMIT;

  if (asked !== null) {
    if (!/^\d{1,3}$/.test(asked)) {
      return { ok: false, response: errorResponse("invalid_request", "limit must be a whole number") };
    }

    limit = Number(asked);

    if (limit < 1 || limit > MAX_LIMIT) {
      return {
        ok: false,
        response: errorResponse("invalid_request", `limit must be between 1 and ${MAX_LIMIT}`),
      };
    }
  }

  const cursor = params.get("cursor");

  if (cursor === null) {
    return { ok: true, page: { limit, after: null } };
  }

  const after = decodeCursor(cursor);

  return after === null
    ? { ok: false, response: errorResponse("invalid_cursor") }
    : { ok: true, page: { limit, after } };
}

export function encodeCursor(key: string): string {
  return Buffer.from(`v1:${key}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): string | null {
  if (cursor.length > 512) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");

    /* The version prefix is what lets the key's shape change later without a
       cursor from an older deployment being read as a key of the new shape. */
    return decoded.startsWith("v1:") ? decoded.slice(3) : null;
  } catch {
    return null;
  }
}

export interface Page<Item> {
  items: Item[];
  nextCursor: string | null;
}

/**
 * One page, and the cursor that follows it.
 *
 * Reads are asked for one row more than the page needs, so the presence of a
 * next page is known rather than guessed: a `nextCursor` on a list that turns
 * out to be empty sends a consumer round an extra loop every time.
 */
export function pageOf<Item>(
  rows: readonly Item[],
  limit: number,
  keyOf: (item: Item) => string,
): Page<Item> {
  const items = rows.slice(0, limit);
  const more = rows.length > limit;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: more && last !== undefined ? encodeCursor(keyOf(last)) : null,
  };
}

/** How many rows to ask a source for, to answer a page of `limit`. */
export function fetchCount(limit: number): number {
  return limit + 1;
}
