import { expect, it } from "vitest";
import { turnoutPercent } from "./turnout";
it("reports vote turnout from eligible voters only", () => {
  expect(turnoutPercent({ eligible: 8, ballots: 6 })).toBe(75);
});
