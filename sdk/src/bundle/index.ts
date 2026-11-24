/**
 * Offline evidence-bundle reading and checking.
 *
 * The proof page ships a zip. This package is what a stranger uses to confirm
 * that zip still matches its own hash manifest after the website is gone.
 */

export {
  BUNDLE_FORMAT,
  BUNDLE_VERSION,
  REQUIRED_PATHS,
  isManifest,
  type Manifest,
  type ManifestFile,
} from "./format.js";
export { readBundle, unzipStore, sha256Hex, type BundleFiles } from "./read.js";
export { checkBundle, checkOpened, type CheckResult } from "./check.js";
export { main as runBundleCli } from "./cli.js";
