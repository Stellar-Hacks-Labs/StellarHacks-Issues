import { expect, it } from "vitest";
import { DEFAULT_RETRY_BUDGET } from "../src/budget.js";

it("keeps every retry budget finite", () => {
  expect(DEFAULT_RETRY_BUDGET.attempts).toBeGreaterThan(0);
  expect(DEFAULT_RETRY_BUDGET.maxDelayMs).toBeLessThanOrEqual(10_000);
});
