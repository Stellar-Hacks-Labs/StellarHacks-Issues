import { describe, expect, it, vi } from "vitest";
import { submitWithRetry } from "../src/retry.js";

describe("bounded transition retry", () => {
  it("never submits after another actor has advanced the phase", async () => {
    const submit = vi.fn().mockRejectedValueOnce(new Error("RPC timeout"));
    const stillDue = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(submitWithRetry({ submit, stillDue, sleep: async () => {}, random: () => 0 })).resolves.toBeNull();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("stops at the configured attempt budget", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("RPC timeout"));
    await expect(submitWithRetry({
      submit,
      stillDue: async () => true,
      budget: { attempts: 2, baseDelayMs: 1, maxDelayMs: 1, maxFeeStroops: 10 },
      sleep: async () => {},
    })).rejects.toThrow("retry budget exhausted");
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
