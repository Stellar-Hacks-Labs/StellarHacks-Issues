/**
 * Uniform health report contract across all four backend services
 * (indexer, sealer, clock, and reviewer).
 */

export interface ServiceHealthReport {
  service: string;
  status: "ok" | "degraded" | "error";
  lastSuccessfulTick: string | null;
  lag: number;
  lastError: string | null;
  uptimeSeconds: number;
}

export class HealthMonitor {
  private lastSuccess: Date | null = null;
  private lastErrorMsg: string | null = null;
  private startedAt: Date = new Date();
  private lagCount = 0;

  constructor(private readonly serviceName: string) {}

  recordTickSuccess(lag = 0): void {
    this.lastSuccess = new Date();
    this.lastErrorMsg = null;
    this.lagCount = lag;
  }

  recordTickFailure(error: unknown, lag = 0): void {
    this.lastErrorMsg = error instanceof Error ? error.message : String(error);
    this.lagCount = lag;
  }

  getHealth(): ServiceHealthReport {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAt.getTime()) / 1000);
    let status: "ok" | "degraded" | "error" = "ok";

    if (this.lastErrorMsg) {
      status = "error";
    } else if (this.lagCount > 50) {
      status = "degraded";
    }

    return {
      service: this.serviceName,
      status,
      lastSuccessfulTick: this.lastSuccess ? this.lastSuccess.toISOString() : null,
      lag: this.lagCount,
      lastError: this.lastErrorMsg,
      uptimeSeconds,
    };
  }
}
