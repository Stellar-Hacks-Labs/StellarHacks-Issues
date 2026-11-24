import { expect, it } from "vitest";
import { raisedFee } from "../src/fees.js";

it("never raises a fee above the configured ceiling", () => {
  expect(raisedFee(9, 10)).toBe(10);
  expect(raisedFee(10, 10)).toBe(10);
});
