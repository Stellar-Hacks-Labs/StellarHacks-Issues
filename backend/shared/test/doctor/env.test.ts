import { describe, expect, it } from "vitest";

import { checkRequiredEnv } from "../../src/doctor/env.js";

/**
 * Required env checks treat empty strings as missing.
 *
 * The property under defence is that a copied `.env.example` with `X=""` fails
 * the same way an unset variable does, before a service starts a tight loop.
 */
describe("required environment variables", () => {
  it("passes when every named variable is non-empty", () => {
    const results = checkRequiredEnv(["A", "B"], { A: "1", B: "2" });

    expect(results.every((result) => result.ok)).toBe(true);
  });

  it("fails the env class when a variable is missing", () => {
    const [result] = checkRequiredEnv(["MISSING"], {});

    expect(result?.ok).toBe(false);
    expect(result?.class).toBe("env");
    expect(result?.message).toMatch(/is not set/);
  });

  it("fails the env class when a variable is an empty string", () => {
    const [result] = checkRequiredEnv(["EMPTY"], { EMPTY: "" });

    expect(result?.ok).toBe(false);
    expect(result?.class).toBe("env");
  });
});
