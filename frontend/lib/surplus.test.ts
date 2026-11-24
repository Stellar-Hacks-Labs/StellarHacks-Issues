import { describe, expect, it } from "vitest";

import { addressOf, explain, labelOf } from "./surplus";

describe("surplus route labels", () => {
  it("names pro rata without an address", () => {
    expect(labelOf({ kind: "pro-rata" })).toMatch(/pro rata/i);
    expect(addressOf({ kind: "pro-rata" })).toBeNull();
    expect(explain({ kind: "pro-rata" })).toMatch(/proportion/i);
  });

  it("shortens a return address", () => {
    const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    expect(labelOf({ kind: "return-to", address })).toContain("…");
    expect(addressOf({ kind: "return-to", address })).toBe(address);
  });

  it("describes a roll-forward destination", () => {
    const address = "CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    expect(labelOf({ kind: "roll-forward", address })).toMatch(/rolled forward/i);
    expect(explain({ kind: "roll-forward", address })).toMatch(/next hackathon/i);
  });
});
