import { describe, expect, it } from "vitest";

import { parseArgs } from "../../src/verify/args.js";
import { run } from "../../src/verify/cli.js";
import { referenceEventsPath, referenceStatePath, tamperedStatePath } from "./fixtures.js";

describe("verifier CLI", () => {
  it("exits zero against the reference fixtures", async () => {
    const code = await run([
      "--state",
      referenceStatePath(),
      "--events",
      referenceEventsPath(),
      "--format",
      "json",
    ]);

    expect(code).toBe(0);
  });

  it("exits one when the tampered ranking disagrees", async () => {
    const code = await run([
      "--state",
      tamperedStatePath(),
      "--events",
      referenceEventsPath(),
      "--format",
      "text",
    ]);

    expect(code).toBe(1);
  });

  it("parses format and network flags", () => {
    const args = parseArgs(["CABC", "--format", "json", "--network", "testnet"]);
    expect(args.contractId).toBe("CABC");
    expect(args.format).toBe("json");
    expect(args.rpcUrl).toContain("testnet");
  });
});
