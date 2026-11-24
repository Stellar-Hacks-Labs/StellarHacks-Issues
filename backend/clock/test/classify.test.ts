import { describe, expect, it } from "vitest";
import { classifySubmissionError } from "../src/classify.js";

describe("submission error classification", () => {
  it("retries transient transport failures but stops terminal failures", () => {
    expect(classifySubmissionError(new Error("RPC timeout"))).toBe("retryable");
    expect(classifySubmissionError(new Error("fee too low"))).toBe("fee");
    expect(classifySubmissionError(new Error("invalid contract call"))).toBe("terminal");
  });
});
