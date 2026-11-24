/**
 * The evidence-bundle format the offline verifier understands.
 *
 * Kept in the SDK rather than imported from the frontend so a reader checking
 * a zip never has to pull the web application. The constants must stay aligned
 * with `frontend/lib/bundle/version.ts`.
 */

export const BUNDLE_FORMAT = "stelhacks-evidence-bundle" as const;

export const BUNDLE_VERSION = 1 as const;

export const REQUIRED_PATHS = [
  "manifest.json",
  "constitution.json",
  "events.jsonl",
  "roots.json",
  "disclosures.jsonl",
  "payouts.jsonl",
] as const;

export interface ManifestFile {
  path: string;
  sha256: string;
  bytes: number;
}

export interface Manifest {
  format: typeof BUNDLE_FORMAT;
  version: number;
  contract_id: string;
  files: ManifestFile[];
}

export function isManifest(value: unknown): value is Manifest {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    row.format === BUNDLE_FORMAT &&
    typeof row.version === "number" &&
    typeof row.contract_id === "string" &&
    Array.isArray(row.files)
  );
}
