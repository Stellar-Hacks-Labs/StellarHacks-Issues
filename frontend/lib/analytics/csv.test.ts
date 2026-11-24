import { expect, it } from "vitest";
import { analyticsCsv } from "./csv";
import { analyticsFixture } from "./fixtures";
it("exports counts without personal data", () => {
  const csv = analyticsCsv(analyticsFixture);
  expect(csv).toContain("applications,10");
  expect(csv).not.toContain("user");
});
