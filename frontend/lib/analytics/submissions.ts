export function submissionDropoff(approved: number, submissions: number) {
  return Math.max(0, approved - submissions);
}
