import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";
import { FULL_TEAM, OPEN_LISTING } from "../../../lib/team-board/fixtures";

describe("the team board route", () => {
  it("refuses a reader who is not signed in", async () => {
    const response = await GET(new Request("http://localhost/api/team-board"));
    expect(response.status).toBe(401);
  });

  it("closes a listing once the team is full", async () => {
    const response = await GET(new Request("http://localhost/api/team-board?maxSize=3", {
      headers: {
        "x-reader-id": "reader-1",
        "x-listings": JSON.stringify([OPEN_LISTING]),
        "x-teams": JSON.stringify([FULL_TEAM]),
      },
    }));
    const body = await response.json();
    expect(body.listings).toEqual([]);
  });

  it("rejects a listing past the skill limit", async () => {
    const response = await POST(new Request("http://localhost/api/team-board", {
      method: "POST",
      headers: { "x-reader-id": "reader-1" },
      body: JSON.stringify({ ...OPEN_LISTING, skills: ["a","b","c","d","e","f","g","h","i"] }),
    }));
    expect(response.status).toBe(400);
  });
});
