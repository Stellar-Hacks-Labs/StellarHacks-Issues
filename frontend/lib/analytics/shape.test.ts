import { expect, it } from "vitest";
import { shapeAnalytics } from "./shape";
it("gives empty analytics a stable zero shape", () => {
  expect(shapeAnalytics(null, null, null).funnel.submissions).toBe(0);
});
