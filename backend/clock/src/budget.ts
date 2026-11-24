export interface RetryBudget {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  maxFeeStroops: number;
}

export const DEFAULT_RETRY_BUDGET: RetryBudget = {
  attempts: 4,
  baseDelayMs: 250,
  maxDelayMs: 4_000,
  maxFeeStroops: 100_000,
};
