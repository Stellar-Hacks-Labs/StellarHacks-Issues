/**
 * How often one reader may file a report.
 *
 * Three an hour is enough to flag a page that is actually wrong and not
 * enough to use the queue as a message board. The window is counted from
 * the timestamps the caller already has; this function does not read a clock
 * of its own, so a test can place the reports wherever it needs.
 */
export const REPORT_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 } as const;

export function reportAllowed(previous: number[], now: number): boolean {
  const recent = previous.filter((at) => now - at < REPORT_LIMIT.windowMs);
  return recent.length < REPORT_LIMIT.max;
}
