"use server";

import { decide, type Decision } from "../../../lib/moderation";

/** The server action the decision form calls. The record is the return value. */
export async function recordDecision(input: { reportId: string; action: string; reason: string; actorId: string; staff: boolean }): Promise<Decision | { error: string }> {
  return decide({ ...input, at: new Date().toISOString() });
}
