import { describe, expect, it } from "vitest";

import { buildManifest, encodeManifest, sha256Hex } from "./manifest";
import { utf8 } from "./serialize";

describe("buildManifest", () => {
  it("lists every payload file with a digest that matches the bytes", () => {
    const files = new Map<string, Uint8Array>([
      ["events.jsonl", utf8("{\"n\":1}\n")],
      ["constitution.json", utf8("{}\n")],
    ]);

    const manifest = buildManifest("CCONTRACT", files);

    expect(manifest.format).toBe("stelhacks-evidence-bundle");
    expect(manifest.version).toBe(1);
    expect(manifest.contract_id).toBe("CCONTRACT");
    expect(manifest.files.map((file) => file.path)).toEqual([
      "constitution.json",
      "events.jsonl",
    ]);
    expect(manifest.files[0]!.sha256).toBe(sha256Hex(files.get("constitution.json")!));
  });

  it("encodes the same manifest to the same bytes twice", () => {
    const files = new Map([["roots.json", utf8("{}\n")]]);
    const once = encodeManifest(buildManifest("C1", files));
    const twice = encodeManifest(buildManifest("C1", files));
    expect(Buffer.from(once).equals(Buffer.from(twice))).toBe(true);
  });
});
