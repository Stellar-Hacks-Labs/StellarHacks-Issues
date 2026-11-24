/**
 * The evidence-bundle format version this build writes and understands.
 *
 * Bumped only when a reader of an older zip would misread a file. Adding an
 * optional path does not bump it; renaming or reshaping a required file does.
 */
export const BUNDLE_FORMAT = "stelhacks-evidence-bundle" as const;

export const BUNDLE_VERSION = 1 as const;

/** Paths every valid v1 bundle carries, in the order they appear in the zip. */
export const BUNDLE_PATHS = [
  "manifest.json",
  "constitution.json",
  "events.jsonl",
  "roots.json",
  "disclosures.jsonl",
  "payouts.jsonl",
] as const;

export type BundlePath = (typeof BUNDLE_PATHS)[number];
