import { expect, it } from "vitest";
import { jitter } from "../src/jitter.js";

it("keeps jitter inside the documented quarter band", () => {
  expect(jitter(100, () => 0)).toBe(75);
  expect(jitter(100, () => 1)).toBe(125);
});
