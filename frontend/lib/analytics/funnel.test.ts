import { expect, it } from "vitest";
import { funnelRows } from "./funnel";
import { analyticsFixture } from "./fixtures";
it("keeps funnel counts in lifecycle order", () => {
  expect(funnelRows(analyticsFixture.funnel).map((row) => row.count)).toEqual([
    10, 8, 5,
  ]);
});
