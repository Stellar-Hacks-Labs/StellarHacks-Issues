import type { OrganizerAnalytics } from "./shape";
export function analyticsCsv(data: OrganizerAnalytics) {
  return [
    "measure,count",
    `applications,${data.funnel.applications}`,
    `approved,${data.funnel.approved}`,
    `submissions,${data.funnel.submissions}`,
    `judge_completed,${data.judges.completed}`,
    `judge_expected,${data.judges.expected}`,
    `ballots,${data.turnout.ballots}`,
    `eligible_voters,${data.turnout.eligible}`,
  ].join("\n");
}
