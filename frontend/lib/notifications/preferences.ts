export const NOTIFICATION_TYPES = [
  "application_decided",
  "submissions_open",
  "judging_open",
  "results_revealed",
  "prize_payable",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
