/**
 * A decision is a record. It is not a write to the chain and it is not a
 * write to the results.
 *
 * Hiding a project changes who the platform shows it to. The score, the
 * rank, and the payment stay where the contract left them. A decision that
 * cannot name its actor, its time, and its reason is not a decision.
 */
export type DecisionAction = "hide" | "restore" | "dismiss";

export type Decision = {
  reportId: string;
  action: DecisionAction;
  actorId: string;
  at: string;
  reason: string;
};

export function decide(input: { reportId: string; action: string; actorId: string; at: string; reason: string; staff: boolean }): Decision | { error: string } {
  if (!input.staff) return { error: "staff only" };
  if (!input.actorId || !input.at) return { error: "a decision needs an actor and a time" };
  const reason = input.reason.trim();
  if (reason.length === 0) return { error: "a decision needs a reason" };
  if (input.action !== "hide" && input.action !== "restore" && input.action !== "dismiss") {
    return { error: "unknown action" };
  }
  return { reportId: input.reportId, action: input.action, actorId: input.actorId, at: input.at, reason };
}
