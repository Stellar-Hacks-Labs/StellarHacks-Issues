import { describe, expect, it } from "vitest";
import { reportAllowed } from "./rate-limit";

describe("three reports an hour", () => {
  it("refuses the fourth inside the hour and allows it once the hour has passed", () => {
    const hour = 60 * 60 * 1000;
    const now = 10 * hour;
    expect(reportAllowed([now - 1000, now - 2000, now - 3000], now)).toBe(false);
    expect(reportAllowed([now - hour - 1], now)).toBe(true);
  });
});
