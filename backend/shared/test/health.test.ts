import { describe, it, expect } from "vitest";
import { HealthMonitor } from "../src/health.js";

describe("Uniform Health Monitor", () => {
  it("reports healthy status on successful tick", () => {
    const monitor = new HealthMonitor("indexer");
    monitor.recordTickSuccess(0);

    const report = monitor.getHealth();
    expect(report.service).toBe("indexer");
    expect(report.status).toBe("ok");
    expect(report.lag).toBe(0);
    expect(report.lastError).toBeNull();
    expect(report.lastSuccessfulTick).toBeDefined();
  });

  it("reports degraded when lag exceeds threshold", () => {
    const monitor = new HealthMonitor("indexer");
    monitor.recordTickSuccess(60);

    const report = monitor.getHealth();
    expect(report.status).toBe("degraded");
    expect(report.lag).toBe(60);
  });

  it("reports error when failure occurs", () => {
    const monitor = new HealthMonitor("sealer");
    monitor.recordTickFailure(new Error("RPC endpoint unreachable"));

    const report = monitor.getHealth();
    expect(report.service).toBe("sealer");
    expect(report.status).toBe("error");
    expect(report.lastError).toContain("RPC endpoint unreachable");
  });
});
