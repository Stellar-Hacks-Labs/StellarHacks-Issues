import { seedScript, type Journey } from "../scripts/lib/steps.mts";

/** The command the global setup runs. It does not reimplement the chain calls. */
export function seedPlan(journey: Journey): { command: string; script: string } {
  return { command: "node --experimental-strip-types", script: seedScript(journey) };
}
