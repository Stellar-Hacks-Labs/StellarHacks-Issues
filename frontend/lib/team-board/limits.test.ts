import { describe, expect, it } from "vitest";
import { TEAM_BOARD_LIMITS, withinLimits } from "./limits";

describe("a listing stays a role, not a resume", () => {
  it("refuses a ninth skill", () => {
    const skills = Array.from({ length: TEAM_BOARD_LIMITS.maxSkills + 1 }, (_, index) => `s${index}`);
    expect(withinLimits({ skills, roles: ["one"], note: "hi" })).toBe("too many skills");
  });
});
