import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { main } from "../../src/bundle/cli.js";

const dir = join(process.cwd(), "..", "fixtures", "bundle");

describe("bundle cli", () => {
  it("exits zero on the reference bundle and non-zero on the tampered one", () => {
    expect(main(["check", join(dir, "reference-bundle.zip")])).toBe(0);
    expect(main(["check", join(dir, "tampered-bundle.zip")])).toBe(1);
  });

  it("prints usage when the command is missing", () => {
    expect(main([])).toBe(2);
  });
});
