import { expect, it } from "vitest";
import { transitionStillDue } from "../src/idempotency.js";

it("refuses a retry after the phase changes", async () => {
  await expect(transitionStillDue(async () => 4, 3)).resolves.toBe(false);
});
