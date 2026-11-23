import { describe, it, expect } from "vitest";
import { getHealth, reviewerHealth } from "../src/health.js";

describe("Reviewer Health", () => {
  it("exposes the uniform service health shape", () => {
    reviewerHealth.recordTickSuccess(0);
    const health = getHealth();
    expect(health.service).toBe("reviewer");
    expect(health.status).toBe("ok");
    expect(health.lag).toBe(0);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
