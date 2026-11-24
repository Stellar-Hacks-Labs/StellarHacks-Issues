import { describe, expect, it } from "vitest";

import { compareCheck } from "../../src/verify/compare.js";
import { buildReport, formatJson, formatText } from "../../src/verify/report.js";

describe("report formats text and json without losing disagreements", () => {
  it("prints FAIL lines for disagreements in text", () => {
    const report = buildReport("CTEST", [
      compareCheck("constitution.hash", "aa", "bb"),
    ]);
    const text = formatText(report);

    expect(report.ok).toBe(false);
    expect(text).toContain("[FAIL] constitution.hash");
    expect(text).toContain("Result: disagree");
  });

  it("serialises bigints in json", () => {
    const report = buildReport("CTEST", [compareCheck("amount", 5n, 5n)]);
    const json = formatJson(report);

    expect(json).toContain('"expected": "5"');
    expect(JSON.parse(json).ok).toBe(true);
  });
});
