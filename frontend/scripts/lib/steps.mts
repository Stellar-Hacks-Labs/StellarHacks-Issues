/**
 * Which existing script seeds which journey.
 *
 * The chain transactions stay in those scripts. This module only names them,
 * so a test does not grow a second copy of the lifecycle.
 */
export const JOURNEYS = [
  "organizer",
  "participant",
  "team",
  "judge",
  "voter",
  "observer",
  "settlement",
  "vote-sealed",
  "cancellation",
  "disqualification",
] as const;

export type Journey = (typeof JOURNEYS)[number];

export function seedScript(journey: Journey): string {
  if (journey === "vote-sealed") return "scripts/sealed-lifecycle.mts";
  if (journey === "settlement") return "scripts/park-at-settlement.mts";
  if (journey === "participant" || journey === "team") return "scripts/seed-project.mts";
  if (journey === "organizer") return "scripts/seed-testnet.mts";
  return "scripts/full-lifecycle.mts";
}
