import { describe, it, expect } from "vitest";
import {
  generateCorrelationId,
  setCorrelationId,
  getCorrelationId,
  withCorrelationId,
} from "../src/correlation.js";

describe("Correlation ID Manager", () => {
  it("generates valid UUIDs", () => {
    const id = generateCorrelationId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("sets and retrieves current correlation ID", () => {
    setCorrelationId("tick-corr-999");
    expect(getCorrelationId()).toBe("tick-corr-999");
  });

  it("runs scoped execution with correlation context", () => {
    const result = withCorrelationId("scoped-corr-1", () => {
      return getCorrelationId();
    });
    expect(result).toBe("scoped-corr-1");
  });
});
