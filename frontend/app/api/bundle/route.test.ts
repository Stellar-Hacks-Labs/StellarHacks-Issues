import { describe, expect, it } from "vitest";

import { sha256Hex } from "../../../lib/bundle";
import { GET } from "./route";

describe("GET /api/bundle", () => {
  it("streams a zip whose two exports match byte for byte", async () => {
    const first = await GET(
      new Request("http://localhost/api/bundle?contract=CCOMPLETED", {
        headers: { "x-bundle-fixture": "completed" },
      }),
    );
    const second = await GET(
      new Request("http://localhost/api/bundle?contract=CCOMPLETED", {
        headers: { "x-bundle-fixture": "completed" },
      }),
    );

    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toBe("application/zip");

    const a = new Uint8Array(await first.arrayBuffer());
    const b = new Uint8Array(await second.arrayBuffer());
    expect(sha256Hex(a)).toBe(sha256Hex(b));
  });

  it("never includes unrevealed sealed inputs in the archive", async () => {
    const response = await GET(
      new Request("http://localhost/api/bundle?contract=CUNREVEALED", {
        headers: { "x-bundle-fixture": "unrevealed" },
      }),
    );
    const bytes = Buffer.from(await response.arrayBuffer()).toString("utf8");

    expect(bytes).not.toContain("should-not-ship");
    expect(bytes).not.toContain("ciphertext");
    expect(bytes).not.toContain("tlock_round");
  });

  it("returns a preview with size and contents before download", async () => {
    const response = await GET(
      new Request("http://localhost/api/bundle?contract=CCOMPLETED&preview=1", {
        headers: { "x-bundle-fixture": "completed" },
      }),
    );
    const body = await response.json();

    expect(body.bytes).toBeGreaterThan(0);
    expect(body.files.map((file: { path: string }) => file.path)).toContain("manifest.json");
    expect(body.files.map((file: { path: string }) => file.path)).toContain("events.jsonl");
  });
});
