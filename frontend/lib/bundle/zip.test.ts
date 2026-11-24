import { describe, expect, it } from "vitest";

import { crc32, zipBundle } from "./zip";
import { utf8 } from "./serialize";
import { sha256Hex } from "./manifest";

describe("zipBundle", () => {
  it("writes the same archive bytes for the same files twice", () => {
    const files = new Map([
      ["manifest.json", utf8('{"version":1}\n')],
      ["constitution.json", utf8("{}\n")],
      ["events.jsonl", utf8("")],
      ["roots.json", utf8("{}\n")],
      ["disclosures.jsonl", utf8("")],
      ["payouts.jsonl", utf8("")],
    ]);

    const once = zipBundle(files);
    const twice = zipBundle(files);
    expect(sha256Hex(once)).toBe(sha256Hex(twice));
  });

  it("stores a CRC that matches the payload so unzippers accept the archive", () => {
    const payload = utf8("hello");
    expect(crc32(payload)).toBe(0x3610a686);
  });
});
