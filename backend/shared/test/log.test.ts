import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "../src/log.js";
import { setCorrelationId, clearCorrelationId } from "../src/correlation.js";

describe("Structured Logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    clearCorrelationId();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes structured JSON logs with correlationId, service, and timestamp", () => {
    setCorrelationId("corr-12345");
    const logger = createLogger("test-service");
    const entry = logger.info("Process tick completed", { count: 5 });

    expect(entry.service).toBe("test-service");
    expect(entry.correlationId).toBe("corr-12345");
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("Process tick completed");
    expect(entry.meta).toEqual({ count: 5 });
    expect(logSpy).toHaveBeenCalled();
  });

  it("redacts sensitive Stellar seeds and keys in logged messages and metadata", () => {
    const logger = createLogger("test-service");
    const secretSeed = "SBBCDEF234567GHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQ";
    const entry = logger.warn(`Failed with seed ${secretSeed}`, { secret: secretSeed });

    expect(entry.message).not.toContain(secretSeed);
    expect(entry.message).toContain("[REDACTED_SECRET_SEED]");
    expect(entry.meta?.secret).toBe("[REDACTED]");
  });
});
