import type { NotificationType } from "./rules.js";
const COPY: Record<NotificationType, string> = { application_decided: "Your application has been decided.", submissions_open: "Project submissions are open.", judging_open: "Judging is open.", results_revealed: "Results are available.", prize_payable: "A prize is ready to claim." };
export function notificationCopy(type: NotificationType) { return COPY[type]; }
