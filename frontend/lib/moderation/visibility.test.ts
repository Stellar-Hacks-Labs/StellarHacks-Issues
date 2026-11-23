import { describe, expect, it } from "vitest";
import { HIDE } from "./fixtures";
import { applyVisibility } from "./visibility";

describe("hiding a project leaves it in the results", () => {
  it("keeps the row and marks it hidden, and a later restore clears the mark", () => {
    const projects = [{ id: "proj-1", title: "Quay" }, { id: "proj-2", title: "Other" }];
    const hidden = applyVisibility(projects, [HIDE]);
    expect(hidden.map((project) => project.id)).toEqual(["proj-1", "proj-2"]);
    expect(hidden[0].hidden).toBe(true);
    const restored = applyVisibility(projects, [HIDE, { ...HIDE, action: "restore" }]);
    expect(restored[0].hidden).toBe(false);
  });
});
