import { isCategory, type ReportCategory } from "./categories";

export type ReportTarget = { type: "project" | "profile"; id: string };

export type Report = {
  id: string;
  target: ReportTarget;
  category: ReportCategory;
  note: string;
  reporterId: string;
  createdAt: string;
};

export function draftReport(input: { target: ReportTarget; category: string; note: string; reporterId: string; now: string }): Report | { error: string } {
  if (!input.reporterId) return { error: "sign in to report" };
  if (input.target.id.trim() === "") return { error: "missing target" };
  if (!isCategory(input.category)) return { error: "unknown category" };
  const note = input.note.trim();
  if (note.length > 500) return { error: "note is too long" };
  return {
    id: `${input.target.type}:${input.target.id}:${input.now}`,
    target: input.target,
    category: input.category,
    note,
    reporterId: input.reporterId,
    createdAt: input.now,
  };
}
