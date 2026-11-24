import { describe, expect, it } from "vitest";
import { notificationType } from "../src/notify/rules.js";

describe("notification rules", () => {
  it("maps only actionable lifecycle events", () => {
    expect(notificationType("ApplicationDecided", {})).toBe("application_decided");
    expect(notificationType("PhaseAdvanced", { phase: 4 })).toBe("judging_open");
    expect(notificationType("PhaseAdvanced", { phase: 3 })).toBeNull();
  });
});
