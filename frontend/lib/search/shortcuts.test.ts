import { describe, expect, it } from "vitest";
import { searchShortcut } from "./shortcuts";

describe("the header search keys", () => {
  it("focuses on slash and on command-k, and clears on escape", () => {
    expect(searchShortcut({ key: "/", metaKey: false, ctrlKey: false })).toBe("focus");
    expect(searchShortcut({ key: "k", metaKey: true, ctrlKey: false })).toBe("focus");
    expect(searchShortcut({ key: "Escape", metaKey: false, ctrlKey: false })).toBe("clear");
    expect(searchShortcut({ key: "a", metaKey: false, ctrlKey: false })).toBe(null);
  });
});
