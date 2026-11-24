import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";

import { completedSource, unrevealedSource } from "../../app/api/bundle/fixtures";
import { collectBundle, exportBundle, sha256Hex } from "./index";
import { zipBundle } from "./zip";

/**
 * Writes the committed fixtures under fixtures/bundle/.
 *
 * Run with GENERATE_BUNDLE_FIXTURES=1 when the reference archive needs to change.
 * Left as a test so it rides the same TypeScript path the suite already uses.
 */
describe("generate bundle fixtures", () => {
  it("writes reference, tampered and unrevealed fixtures when asked", () => {
    if (process.env.GENERATE_BUNDLE_FIXTURES !== "1") {
      return;
    }

    const out = join(process.cwd(), "..", "fixtures", "bundle");
    mkdirSync(out, { recursive: true });

    const reference = exportBundle(completedSource);
    writeFileSync(join(out, "reference-bundle.zip"), reference);

    const files = collectBundle(completedSource);
    writeFileSync(join(out, "manifest.json"), files.get("manifest.json")!);

    const tamperedFiles = new Map(collectBundle(completedSource));
    const events = Buffer.from(tamperedFiles.get("events.jsonl")!);
    events[0] = events[0]! ^ 0xff;
    tamperedFiles.set("events.jsonl", new Uint8Array(events));
    tamperedFiles.set("manifest.json", files.get("manifest.json")!);
    writeFileSync(join(out, "tampered-bundle.zip"), zipBundle(tamperedFiles));

    writeFileSync(
      join(out, "unrevealed-hackathon.json"),
      JSON.stringify(unrevealedSource, null, 2) + "\n",
    );

    // Touch the hashes so a missing write fails loudly when generating.
    expectHash(reference);
  });
});

function expectHash(bytes: Uint8Array): void {
  if (sha256Hex(bytes).length !== 64) {
    throw new Error("fixture hash missing");
  }
}
