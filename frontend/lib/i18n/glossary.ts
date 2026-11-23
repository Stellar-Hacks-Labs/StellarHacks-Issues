/**
 * Shared glossary for phase names, roles, and verdicts.
 *
 * Ensures consistent terminology across all surfaces. Used by phase.ts and
 * verdict.ts to avoid hard-coded strings scattered throughout the codebase.
 */

import { createTranslator } from "./translate";
import type { Locale } from "./config";

/**
 * Get a phase name from the glossary.
 *
 * Returns the localized name for a phase number, or a default message for null/unknown phases.
 */
export function phaseName(phase: number | null, locale: Locale): string {
  const t = createTranslator(locale, "glossary");

  if (phase === null) {
    return t("phase.not_published");
  }

  const phaseKeys = [
    "phase.draft",
    "phase.funding",
    "phase.open",
    "phase.screening",
    "phase.judging",
    "phase.reveal",
    "phase.finalization",
    "phase.settlement",
    "phase.completed",
    "phase.cancelled",
  ];

  return phase >= 0 && phase < phaseKeys.length ? t(phaseKeys[phase]) : t("phase.unknown");
}

/**
 * Get a journey step title from the glossary.
 *
 * Journey steps are the high-level stages an organizer sees (Setup, Sign-ups, etc).
 */
export function journeyTitle(stepIndex: number, locale: Locale): string {
  const t = createTranslator(locale, "glossary");

  const stepKeys = [
    "journey.setup",
    "journey.signups",
    "journey.entry_check",
    "journey.judging",
    "journey.results",
    "journey.payouts",
  ];

  return stepIndex >= 0 && stepIndex < stepKeys.length ? t(stepKeys[stepIndex]) : "";
}

/**
 * Get a role name from the glossary.
 */
export function roleName(role: "organizer" | "judge" | "participant" | "observer", locale: Locale): string {
  const t = createTranslator(locale, "glossary");
  return t(`role.${role}`);
}

/**
 * Get a verdict label from the glossary.
 */
export function verdictLabel(verdict: "verified" | "does_not_match" | "unchecked" | "not_available", locale: Locale): string {
  const t = createTranslator(locale, "glossary");
  return t(`verdict.${verdict}`);
}
