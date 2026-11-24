import { expect, it } from "vitest";
import { applicationDropoff } from "./applications";
it("never reports a negative application dropoff", () => {
  expect(applicationDropoff(2, 3)).toBe(0);
});
