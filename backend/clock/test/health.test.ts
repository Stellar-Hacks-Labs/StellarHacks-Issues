import { describe, it, expect } from "vitest";
import { getHealth, clockHealth } from "../src/health.js";

describe("Clock Health", () => {
  it("exposes the uniform service health shape", () => {
    clockHealth.recordTickSuccess(0);
    const health = getHealth();
    expect(health.service).toBe("clock");
    expect(health.status).toBe("ok");
    expect(health.lag).toBe(0);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
