/**
 * The hash list that lets a verifier trust every other file in the zip.
 *
 * The manifest itself is excluded from the hash list: hashing a file that names
 * its own digest either loops or has to be special-cased. Verifiers recompute
 * every listed digest and refuse a zip whose bytes disagree.
 */

import { createHash } from "node:crypto";

import { BUNDLE_FORMAT, BUNDLE_VERSION, type BundlePath } from "./version";
import { stableStringify, utf8 } from "./serialize";

export interface ManifestFile {
  path: string;
  sha256: string;
  bytes: number;
}

export interface Manifest {
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  contract_id: string;
  files: ManifestFile[];
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Build the manifest over every payload file.
 *
 * Paths are sorted so the same set of files always produces the same listing
 * order, which matters once the manifest bytes themselves are compared.
 */
export function buildManifest(
  contractId: string,
  files: ReadonlyMap<string, Uint8Array>,
): Manifest {
  const listing: ManifestFile[] = [...files.entries()]
    .filter(([path]) => path !== "manifest.json")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, bytes]) => ({
      path,
      sha256: sha256Hex(bytes),
      bytes: bytes.byteLength,
    }));

  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    contract_id: contractId,
    files: listing,
  };
}

export function encodeManifest(manifest: Manifest): Uint8Array {
  return utf8(stableStringify(manifest) + "\n");
}

export function totalBytes(files: ReadonlyMap<string, Uint8Array>): number {
  let sum = 0;
  for (const bytes of files.values()) {
    sum += bytes.byteLength;
  }
  return sum;
}

export function describeContents(files: ReadonlyMap<string, Uint8Array>): {
  path: BundlePath | string;
  bytes: number;
}[] {
  return [...files.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, bytes]) => ({ path, bytes: bytes.byteLength }));
}
