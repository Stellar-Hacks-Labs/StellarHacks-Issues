export type SubmissionErrorClass = "retryable" | "fee" | "terminal";

/** Classification stays deliberately small: unknown failures must not be retried forever. */
export function classifySubmissionError(error: unknown): SubmissionErrorClass {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (/fee|insufficient.*balance|tx_bad_seq/.test(message)) return "fee";
  if (/timeout|temporar|429|502|503|504|connection|unavailable/.test(message)) return "retryable";
  return "terminal";
}
