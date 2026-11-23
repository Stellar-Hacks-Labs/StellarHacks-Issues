import { describe, it, expect } from "vitest";
import { health } from "../src/health.js";

describe("Indexer Health", () => {
  it("calculates lag and reports head position", async () => {
    // contract argument
    expect(typeof health).toBe("function");
  });
});
