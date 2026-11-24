import { expect, it } from "vitest";
import { judgePercent } from "./judges";
it("reports judge completion without dividing by zero", () => {
  expect(judgePercent({ expected: 0, completed: 0 })).toBe(0);
  expect(judgePercent({ expected: 4, completed: 3 })).toBe(75);
});
