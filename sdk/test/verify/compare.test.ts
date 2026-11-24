import { describe, expect, it } from "vitest";

import { allOk, compareCheck, disagreements } from "../../src/verify/compare.js";

describe("compare records structured disagreements", () => {
  it("marks equal values as ok", () => {
    const check = compareCheck("sample", { a: 1n }, { a: 1n });
    expect(check.ok).toBe(true);
  });

  it("keeps only the failed checks in disagreements", () => {
    const checks = [
      compareCheck("a", 1, 1),
      compareCheck("b", 1, 2),
    ];

    expect(allOk(checks)).toBe(false);
    expect(disagreements(checks).map((check) => check.name)).toEqual(["b"]);
  });
});
