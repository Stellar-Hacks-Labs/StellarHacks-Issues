import type { Decision } from "./decisions";
import type { Report } from "./reports";

export const SAMPLE_REPORT: Report = {
  id: "report-1",
  target: { type: "project", id: "proj-1" },
  category: "spam",
  note: "The same link, posted again.",
  reporterId: "reader-1",
  createdAt: "2026-11-21T10:00:00Z",
};

export const HIDE: Decision = {
  reportId: "proj-1",
  action: "hide",
  actorId: "staff-1",
  at: "2026-11-21T11:00:00Z",
  reason: "Repeated unsolicited links.",
};
