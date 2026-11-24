import { describe, expect, it } from "vitest";

import { checkRoots, recomputeRoots } from "../../src/verify/roots.js";
import { loadReference } from "./fixtures.js";

describe("sealed roots rebuild from disclosed leaves", () => {
  it("matches the published score and ballot roots", async () => {
    const loaded = await loadReference();
    const derived = recomputeRoots(loaded.disclosures);

    expect(derived.scoreRoot).toBe(loaded.roots.scoreRoot);
    expect(derived.ballotRoot).toBe(loaded.roots.ballotRoot);

    const checks = checkRoots(loaded.disclosures, loaded.roots);
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it("fails when a published root was swapped", async () => {
    const loaded = await loadReference();
    const checks = checkRoots(loaded.disclosures, {
      scoreRoot: "11".repeat(32),
      ballotRoot: loaded.roots.ballotRoot,
    });

    expect(checks.find((check) => check.name === "roots.score")?.ok).toBe(false);
  });
});
