import { DEFAULT_RETRY_BUDGET, type RetryBudget } from "./budget.js";
import { classifySubmissionError } from "./classify.js";
import { jitter } from "./jitter.js";

export class RetryExhaustedError extends Error {
  constructor(readonly lastError: unknown) {
    super("transition retry budget exhausted", { cause: lastError });
  }
}

export async function submitWithRetry<T>(input: {
  submit: (attempt: number) => Promise<T>;
  stillDue: () => Promise<boolean>;
  budget?: RetryBudget;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}): Promise<T | null> {
  const budget = input.budget ?? DEFAULT_RETRY_BUDGET;
  const sleep = input.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;

  for (let attempt = 0; attempt < budget.attempts; attempt += 1) {
    if (!(await input.stillDue())) return null;
    try {
      return await input.submit(attempt);
    } catch (error) {
      lastError = error;
      if (classifySubmissionError(error) === "terminal") throw error;
      if (attempt + 1 < budget.attempts) {
        const delay = Math.min(budget.maxDelayMs, budget.baseDelayMs * 2 ** attempt);
        await sleep(jitter(delay, input.random));
      }
    }
  }

  throw new RetryExhaustedError(lastError);
}
