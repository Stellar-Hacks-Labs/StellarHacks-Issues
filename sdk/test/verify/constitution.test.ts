import { describe, expect, it } from "vitest";

import { checkConstitution } from "../../src/verify/constitution.js";
import { loadReference } from "./fixtures.js";

describe("constitution hash matches the locked digest", () => {
  it("agrees with the reference fixture", async () => {
    const loaded = await loadReference();
    const check = checkConstitution({
      constitution: loaded.constitution,
      publishedHash: loaded.publishedHash,
    });

    expect(check.ok).toBe(true);
    expect(check.expected).toBe(loaded.publishedHash);
  });

  it("disagrees when the published digest is wrong", async () => {
    const loaded = await loadReference();
    const check = checkConstitution({
      constitution: loaded.constitution,
      publishedHash: "00".repeat(32),
    });

    expect(check.ok).toBe(false);
    expect(check.name).toBe("constitution.hash");
  });
});
