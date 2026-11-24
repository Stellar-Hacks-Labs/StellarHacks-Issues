import { expect, it } from "vitest";
import { submissionDropoff } from "./submissions";
it("counts approved teams that have not submitted", () => {
  expect(submissionDropoff(8, 5)).toBe(3);
});
