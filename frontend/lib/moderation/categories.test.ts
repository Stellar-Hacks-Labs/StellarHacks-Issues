import { describe, expect, it } from "vitest";
import { isCategory } from "./categories";

describe("a report category is one of the published five", () => {
  it("accepts spam and refuses a category the queue has no column for", () => {
    expect(isCategory("spam")).toBe(true);
    expect(isCategory("dislike")).toBe(false);
  });
});
