import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  decodeCursor,
  encodeCursor,
  fetchCount,
  pageOf,
  readPageRequest,
} from "./pagination";

const asked = (query: string) => readPageRequest(new URLSearchParams(query));

describe("a page request", () => {
  it("has a documented default and an upper bound", async () => {
    const plain = asked("");

    expect(plain.ok && plain.page).toEqual({ limit: DEFAULT_LIMIT, after: null });

    const capped = asked(`limit=${MAX_LIMIT + 1}`);

    expect(capped.ok).toBe(false);
    if (!capped.ok) {
      await expect(capped.response.json()).resolves.toMatchObject({
        error: { code: "invalid_request", detail: `limit must be between 1 and ${MAX_LIMIT}` },
      });
    }
  });

  it("refuses a limit that is not a whole number rather than guessing one", () => {
    for (const query of ["limit=0", "limit=-5", "limit=ten", "limit=10.5", "limit=1e3"]) {
      expect(asked(query).ok).toBe(false);
    }
  });

  it("accepts the bounds themselves", () => {
    const low = asked("limit=1");
    const high = asked(`limit=${MAX_LIMIT}`);

    expect(low.ok && low.page.limit).toBe(1);
    expect(high.ok && high.page.limit).toBe(MAX_LIMIT);
  });
});

describe("a cursor", () => {
  it("round trips the key it was made from", () => {
    const cursor = encodeCursor("2026-11-21T10:00:00.000Z|CABC");

    expect(decodeCursor(cursor)).toBe("2026-11-21T10:00:00.000Z|CABC");

    const request = asked(`cursor=${cursor}`);

    expect(request.ok && request.page.after).toBe("2026-11-21T10:00:00.000Z|CABC");
  });

  it("is opaque, so a client that constructs one is refused", async () => {
    /* A consumer who reads a cursor will eventually build one, and then the key
       inside it is part of a contract nobody meant to promise. */
    const refused = asked("cursor=2026-11-21");

    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.response.status).toBe(400);
      await expect(refused.response.json()).resolves.toMatchObject({ error: { code: "invalid_cursor" } });
    }
  });

  it("refuses a cursor from a different version of the key", () => {
    expect(decodeCursor(Buffer.from("v2:something", "utf8").toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from("no-version", "utf8").toString("base64url"))).toBeNull();
  });

  it("refuses an absurdly long cursor without trying to decode it", () => {
    expect(decodeCursor("A".repeat(513))).toBeNull();
  });
});

describe("a page of rows", () => {
  const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("asks for one row more than it needs, so the next page is known rather than guessed", () => {
    expect(fetchCount(2)).toBe(3);

    const page = pageOf(rows, 2, (row) => row.id);

    expect(page.items.map((row) => row.id)).toEqual(["a", "b"]);
    expect(decodeCursor(page.nextCursor ?? "")).toBe("b");
  });

  it("ends with no cursor rather than one that opens an empty page", () => {
    const page = pageOf(rows, 3, (row) => row.id);

    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it("answers an empty source with an empty page and no cursor", () => {
    expect(pageOf([], 10, () => "")).toEqual({ items: [], nextCursor: null });
  });
});
