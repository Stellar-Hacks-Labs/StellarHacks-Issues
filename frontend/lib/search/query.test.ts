import { describe, expect, it } from "vitest";
import { matchesText, termsOf } from "./query";

describe("a query is the words, not the punctuation around them", () => {
  it("drops commas and keeps every remaining word", () => {
    expect(termsOf("USDC, invoices")).toEqual(["usdc", "invoices"]);
    expect(termsOf("   ")).toEqual([]);
  });

  it("requires every word, so a half match is not a match", () => {
    expect(matchesText("Quay", "Settles an invoice", ["invoice"])).toBe(true);
    expect(matchesText("Quay", "Settles an invoice", ["invoice", "stellar"])).toBe(false);
  });
});
