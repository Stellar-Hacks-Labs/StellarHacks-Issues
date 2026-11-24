import { describe, expect, it } from "vitest";

import { randomSalt } from "./strict";

describe("strict-mode helpers", () => {
  it("builds a sixteen-byte salt", () => {
    const salt = randomSalt();
    expect(salt).toHaveLength(16);
  });

  it("builds a different salt each time", () => {
    expect(Buffer.from(randomSalt()).equals(Buffer.from(randomSalt()))).toBe(false);
  });
});
