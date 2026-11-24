/**
 * Open a STORE-method evidence zip without talking to the network.
 *
 * Only the subset of ZIP this product writes is supported: no compression, no
 * data descriptors, no zip64. That is enough for every archive the proof page
 * emits, and refusing the rest keeps the verifier small enough to audit.
 */

import { createHash } from "node:crypto";

import { isManifest, type Manifest } from "./format.js";

export interface BundleFiles {
  /** Raw bytes keyed by path inside the zip. */
  files: Map<string, Uint8Array>;
  manifest: Manifest;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function readBundle(zipBytes: Uint8Array): BundleFiles {
  const files = unzipStore(zipBytes);
  const manifestBytes = files.get("manifest.json");

  if (manifestBytes === undefined) {
    throw new Error("bundle is missing manifest.json");
  }

  const parsed: unknown = JSON.parse(Buffer.from(manifestBytes).toString("utf8"));
  if (!isManifest(parsed)) {
    throw new Error("manifest.json is not a stelhacks evidence bundle");
  }

  return { files, manifest: parsed };
}

/**
 * Minimal ZIP reader for archives written with the STORE method.
 *
 * Walks local file headers until the central directory signature appears.
 */
export function unzipStore(zipBytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const files = new Map<string, Uint8Array>();
  let offset = 0;

  while (offset + 4 <= zipBytes.byteLength) {
    const signature = view.getUint32(offset, true);

    if (signature === 0x02014b50 || signature === 0x06054b50) {
      break;
    }

    if (signature !== 0x04034b50) {
      throw new Error(`unexpected zip signature at ${offset}`);
    }

    const method = view.getUint16(offset + 8, true);
    const compressed = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = Buffer.from(zipBytes.subarray(nameStart, nameStart + nameLength)).toString(
      "utf8",
    );
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressed;

    if (method !== 0) {
      throw new Error(`compressed zip entries are not supported (${name})`);
    }

    files.set(name, zipBytes.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }

  return files;
}
