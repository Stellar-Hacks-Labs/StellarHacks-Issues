import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkBundle } from "../../src/bundle/check.js";

const dir = join(process.cwd(), "..", "fixtures", "bundle");

describe("checkBundle", () => {
  it("passes on the reference bundle", () => {
    const result = checkBundle(
      new Uint8Array(readFileSync(join(dir, "reference-bundle.zip"))),
    );
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails on a modified file whose manifest still claims the old digest", () => {
    const result = checkBundle(
      new Uint8Array(readFileSync(join(dir, "tampered-bundle.zip"))),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("hash mismatch"))).toBe(true);
  });
});
