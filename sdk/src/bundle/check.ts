/**
 * Offline check of an evidence bundle.
 *
 * Recomputes every SHA-256 named in the manifest and refuses the zip when any
 * file disagrees, when a required path is missing, or when the format version
 * is unknown. Nothing here talks to RPC: a reader with only the zip can still
 * know the archive was not rewritten after export.
 */

import { BUNDLE_FORMAT, BUNDLE_VERSION, REQUIRED_PATHS } from "./format.js";
import { readBundle, sha256Hex, type BundleFiles } from "./read.js";

export interface CheckResult {
  ok: boolean;
  contractId?: string;
  errors: string[];
}

export function checkBundle(zipBytes: Uint8Array): CheckResult {
  let opened: BundleFiles;

  try {
    opened = readBundle(zipBytes);
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  return checkOpened(opened);
}

export function checkOpened(opened: BundleFiles): CheckResult {
  const errors: string[] = [];
  const { files, manifest } = opened;

  if (manifest.format !== BUNDLE_FORMAT) {
    errors.push(`unknown format ${String(manifest.format)}`);
  }

  if (manifest.version !== BUNDLE_VERSION) {
    errors.push(`unsupported bundle version ${manifest.version}`);
  }

  for (const path of REQUIRED_PATHS) {
    if (!files.has(path)) {
      errors.push(`missing required path ${path}`);
    }
  }

  for (const entry of manifest.files) {
    const bytes = files.get(entry.path);

    if (bytes === undefined) {
      errors.push(`manifest names ${entry.path} but the zip does not contain it`);
      continue;
    }

    if (bytes.byteLength !== entry.bytes) {
      errors.push(
        `${entry.path} is ${bytes.byteLength} bytes, manifest says ${entry.bytes}`,
      );
    }

    const digest = sha256Hex(bytes);
    if (digest !== entry.sha256) {
      errors.push(`${entry.path} hash mismatch`);
    }
  }

  return {
    ok: errors.length === 0,
    contractId: manifest.contract_id,
    errors,
  };
}
