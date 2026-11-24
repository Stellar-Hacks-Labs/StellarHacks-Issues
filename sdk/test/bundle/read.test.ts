import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readBundle } from "../../src/bundle/read.js";
import { REQUIRED_PATHS } from "../../src/bundle/format.js";

const fixture = join(process.cwd(), "..", "fixtures", "bundle", "reference-bundle.zip");

describe("readBundle", () => {
  it("opens the reference archive and exposes every required path", () => {
    const opened = readBundle(new Uint8Array(readFileSync(fixture)));

    for (const path of REQUIRED_PATHS) {
      expect(opened.files.has(path)).toBe(true);
    }
    expect(opened.manifest.contract_id.length).toBeGreaterThan(0);
  });
});
