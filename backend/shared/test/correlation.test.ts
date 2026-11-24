import { describe, expect, it } from "vitest";

import {
  currentCorrelationId,
  newCorrelationId,
  withCorrelationId,
} from "../src/correlation.js";

/**
 * A tick or request owns one id for its whole async tree.
 */
describe("correlation identifiers", () => {
  it("hands out a fresh id each time so two ticks never share one by accident", () => {
    expect(newCorrelationId()).not.toBe(newCorrelationId());
    expect(newCorrelationId()).toMatch(/^[0-9a-f]{16}$/);
  });

  it("exposes the bound id inside the callback and clears it outside", () => {
    expect(currentCorrelationId()).toBeUndefined();

    const id = newCorrelationId();
    const seen = withCorrelationId(id, () => currentCorrelationId());

    expect(seen).toBe(id);
    expect(currentCorrelationId()).toBeUndefined();
  });
});
