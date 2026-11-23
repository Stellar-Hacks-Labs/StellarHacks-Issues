import type { Decision } from "./decisions";

export type ShownProject = { id: string; hidden: boolean };

/**
 * Hiding never removes a project from the result list.
 *
 * The row stays, with `hidden` set, so a ranking that was computed on chain
 * still has the same projects in the same order. The page reads `hidden`
 * and shows a notice instead of the write-up. Deleting the row would change
 * the result, which a moderation decision is not allowed to do.
 */
export function applyVisibility<T extends { id: string }>(projects: T[], decisions: Decision[]): (T & { hidden: boolean })[] {
  const hidden = new Set(
    decisions.filter((decision) => decision.action === "hide").map((decision) => decision.reportId),
  );
  const restored = new Set(
    decisions.filter((decision) => decision.action === "restore").map((decision) => decision.reportId),
  );
  return projects.map((project) => ({
    ...project,
    hidden: hidden.has(project.id) && !restored.has(project.id),
  }));
}
