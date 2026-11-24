export type NotificationType = "application_decided" | "submissions_open" | "judging_open" | "results_revealed" | "prize_payable";

export function notificationType(eventName: string, fields: Record<string, unknown>): NotificationType | null {
  if (eventName === "ApplicationDecided") return "application_decided";
  if (eventName === "Published") return "submissions_open";
  if (eventName === "PhaseAdvanced" && fields["phase"] === 4) return "judging_open";
  if (eventName === "ResultsFinalized") return "results_revealed";
  if (eventName === "SettlementOpened") return "prize_payable";
  return null;
}
