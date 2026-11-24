/**
 * Evidence bundle assembly for the proof page and its download route.
 *
 * A finished hackathon leaves a receipt on this site. The bundle is that
 * receipt as a file: constitution, every event, sealed roots, disclosures and
 * payouts, plus a hash manifest an offline verifier can check without RPC.
 */

export { BUNDLE_FORMAT, BUNDLE_VERSION, BUNDLE_PATHS } from "./version";
export { collectBundle, type BundleSource, type ChainEventRow, type ChainReadRow } from "./collect";
export { buildManifest, encodeManifest, sha256Hex, totalBytes, describeContents } from "./manifest";
export { zipBundle } from "./zip";
export { redactRecord, redactValue } from "./redact";
export { stableStringify, toJsonl, utf8 } from "./serialize";

import { collectBundle, type BundleSource } from "./collect";
import { describeContents, totalBytes } from "./manifest";
import { zipBundle } from "./zip";

export interface BundlePreview {
  contractId: string;
  bytes: number;
  files: { path: string; bytes: number }[];
}

/** Preview size and contents without producing the zip bytes twice. */
export function previewBundle(source: BundleSource): BundlePreview {
  const files = collectBundle(source);
  return {
    contractId: source.contractId,
    bytes: totalBytes(files),
    files: describeContents(files),
  };
}

/** Full zip bytes for one hackathon. Two calls with the same source match. */
export function exportBundle(source: BundleSource): Uint8Array {
  return zipBundle(collectBundle(source));
}
