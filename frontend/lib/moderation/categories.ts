/** What a report can be about. An unknown category is refused rather than stored as free text. */
export const REPORT_CATEGORIES = ["spam", "harassment", "impersonation", "illegal", "other"] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export function isCategory(value: string): value is ReportCategory {
  return (REPORT_CATEGORIES as readonly string[]).includes(value);
}
