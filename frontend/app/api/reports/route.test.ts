import { describe, expect, it } from "vitest";
import { GET, POST, PUT } from "./route";

describe("the report route", () => {
  it("does not let a non-staff reader open the queue", async () => {
    const response = await GET(new Request("http://localhost/api/reports"));
    expect(response.status).toBe(403);
  });

  it("stores a report and refuses a fourth inside the hour", async () => {
    const filed = await POST(new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { "x-reader-id": "reader-1" },
      body: JSON.stringify({ target: { type: "project", id: "proj-1" }, category: "spam", note: "again", now: 10_000, previous: [] }),
    }));
    expect(filed.status).toBe(201);
    const blocked = await POST(new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { "x-reader-id": "reader-1" },
      body: JSON.stringify({ target: { type: "project", id: "proj-1" }, category: "spam", note: "again", now: 10_000, previous: [9000, 8000, 7000] }),
    }));
    expect(blocked.status).toBe(429);
  });

  it("records the actor, the time, and the reason on a decision", async () => {
    const response = await PUT(new Request("http://localhost/api/reports", {
      method: "PUT",
      headers: { "x-reader-id": "staff-1", "x-reader-staff": "1" },
      body: JSON.stringify({ reportId: "report-1", action: "hide", reason: "spam", at: "2026-11-21T11:00:00Z" }),
    }));
    const body = await response.json();
    expect(body.decision).toMatchObject({ actorId: "staff-1", at: "2026-11-21T11:00:00Z", reason: "spam" });
  });
});
