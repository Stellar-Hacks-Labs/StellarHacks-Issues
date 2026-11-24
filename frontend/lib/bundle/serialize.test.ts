import { describe, expect, it } from "vitest";

import { stableStringify, toJsonl } from "./serialize";

describe("stableStringify", () => {
  it("orders object keys so two insertions of the same map hash the same", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
});

describe("toJsonl", () => {
  it("ends every non-empty stream with a newline and keeps empty streams empty", () => {
    expect(toJsonl([])).toBe("");
    expect(toJsonl([{ a: 1 }, { b: 2 }])).toBe('{"a":1}\n{"b":2}\n');
  });
});
