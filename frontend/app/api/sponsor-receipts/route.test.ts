import { describe, expect, it } from "vitest";

import { GET } from "./route";

/**
 * The route's own checks, which are the ones that run before any chain or
 * database is reached.
 *
 * Nothing here reaches the network: this suite runs with no RPC endpoint and no
 * Supabase project configured, so `rulesFor` answers null and the route says
 * which source it could not read. That order is the point — a malformed request
 * is refused with a sentence whether or not the chain is up, and an unreachable
 * chain is never reported as a sponsor whose money went nowhere.
 */

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const SPONSOR = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";

function asking(query: string): Request {
  return new Request(`http://localhost/api/sponsor-receipts${query}`);
}

describe("asking for an event's sponsors", () => {
  it("needs a hackathon address", async () => {
    const answered = await GET(asking(""));

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "that is not a hackathon address" });
  });

  it("refuses an address of the wrong kind", async () => {
    expect((await GET(asking(`?contract=${SPONSOR}`))).status).toBe(400);
  });

  it("refuses a sponsor filter that is not an account address", async () => {
    const answered = await GET(asking(`?contract=${CONTRACT}&sponsor=${CONTRACT}`));

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "that is not a sponsor address" });
  });

  it("checks the request before reaching for anything", async () => {
    /* Both of these are refused with 400 rather than 503, which is how the
       order above is pinned: validation first, sources second. */
    expect((await GET(asking("?contract=nope"))).status).toBe(400);
    expect((await GET(asking(`?contract=${CONTRACT}&sponsor=nope`))).status).toBe(400);
  });
});

describe("when the chain cannot be reached", () => {
  it("says the frozen rules could not be read, rather than answering with no sponsors", async () => {
    const answered = await GET(asking(`?contract=${CONTRACT}`));

    expect(answered.status).toBe(503);
    await expect(answered.json()).resolves.toEqual({
      error: "the hackathon's frozen rules could not be read, so its prize positions are unknown",
    });
  });

  it("answers the same way whether or not a sponsor was named", async () => {
    const answered = await GET(asking(`?contract=${CONTRACT}&sponsor=${SPONSOR}`));

    expect(answered.status).toBe(503);
  });
});
