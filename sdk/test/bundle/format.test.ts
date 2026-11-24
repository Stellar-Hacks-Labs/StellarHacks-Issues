import { describe, expect, it } from "vitest";

import { BUNDLE_FORMAT, BUNDLE_VERSION, isManifest } from "../../src/bundle/format.js";

describe("evidence bundle format", () => {
  it("recognises a v1 manifest and rejects a stranger", () => {
    expect(
      isManifest({
        format: BUNDLE_FORMAT,
        version: BUNDLE_VERSION,
        contract_id: "C1",
        files: [],
      }),
    ).toBe(true);

    expect(isManifest({ format: "other", version: 1, contract_id: "C1", files: [] })).toBe(
      false,
    );
  });
});
