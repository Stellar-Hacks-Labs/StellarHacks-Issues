import { describe, expect, it } from "vitest";

import { GET, POST } from "./route";

/**
 * The route's own checks, which are the ones that run before the database is
 * reached at all.
 *
 * Nothing here reaches Supabase: the deployment this suite runs in has no
 * project configured, so `serverClient` answers null and the route says so.
 * That is the point of the order these checks are in — a malformed declaration
 * is refused with a sentence whether or not a database is reachable, and the
 * rules about who may write what are the database's job and are covered by the
 * role tests in `backend/supabase/tests`.
 */

const CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
const JUDGE = "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K";

function posting(body: unknown): Request {
  return new Request("http://localhost/api/conflicts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("reading declarations", () => {
  it("needs a hackathon address", async () => {
    const answered = await GET(new Request("http://localhost/api/conflicts"));

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "that is not a hackathon address" });
  });

  it("refuses an address of the wrong kind", async () => {
    const answered = await GET(new Request(`http://localhost/api/conflicts?contract=${JUDGE}`));

    expect(answered.status).toBe(400);
  });

  it("says plainly when this deployment has no database behind it", async () => {
    const answered = await GET(new Request(`http://localhost/api/conflicts?contract=${CONTRACT}`));

    expect(answered.status).toBe(503);
    await expect(answered.json()).resolves.toEqual({ error: "sign in is not configured here" });
  });
});

describe("writing a declaration", () => {
  it("refuses a body that is not JSON", async () => {
    const answered = await POST(posting("{not json"));

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "that is not JSON" });
  });

  it("refuses a relationship that is not on the list, before any database", async () => {
    const answered = await POST(
      posting({ contract: CONTRACT, judge: JUDGE, team: 3, relationship: "acquaintance", note: "" }),
    );

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "choose how you know this team" });
  });

  it("refuses a declaration with no project and one with no judge", async () => {
    await expect(
      (await POST(posting({ contract: CONTRACT, judge: JUDGE, team: 0, relationship: "mentor" }))).json(),
    ).resolves.toEqual({ error: "that is not a project" });
    await expect(
      (await POST(posting({ contract: CONTRACT, team: 3, relationship: "mentor" }))).json(),
    ).resolves.toEqual({ error: "connect the wallet you were named a judge with" });
  });

  it("asks for a description when the relationship is the one the list cannot describe", async () => {
    const answered = await POST(
      posting({ contract: CONTRACT, judge: JUDGE, team: 3, relationship: "other", note: " " }),
    );

    expect(answered.status).toBe(400);
    await expect(answered.json()).resolves.toEqual({ error: "describe the relationship" });
  });

  it("reaches for the database only once the declaration is well formed", async () => {
    const answered = await POST(
      posting({ contract: CONTRACT, judge: JUDGE, team: 3, relationship: "mentor", note: "office hours" }),
    );

    expect(answered.status).toBe(503);
  });
});
