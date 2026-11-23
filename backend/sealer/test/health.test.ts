import { describe, it, expect } from "vitest";
import { getHealth, sealerHealth } from "../src/health.js";

describe("Sealer Health", () => {
  it("exposes the uniform service health shape", () => {
    sealerHealth.recordTickSuccess(0);
    const health = getHealth();
    expect(health.service).toBe("sealer");
    expect(health.status).toBe("ok");
    expect(health.lag).toBe(0);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
