import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * What `docs/deployments.md` publishes that a doctor can check against.
 *
 * Addresses and wasm hashes are public; the point of parsing the file rather
 * than hard-coding them is that a deployment update and a doctor update stay
 * one edit apart.
 */
export interface DeploymentRecord {
  /** Absolute path of the file that was parsed. */
  path: string;
  /** Contract instance addresses found in the document. */
  addresses: string[];
  /** Named instances when a table row labels them. */
  named: Record<string, string>;
  /** Wasm digests listed under the Code table. */
  wasmHashes: string[];
}

const CONTRACT_RE = /\b(C[A-Z0-9]{55})\b/g;
const NAMED_ROW_RE =
  /\|\s*`([^`]+)`\s*\|\s*`?(C[A-Z0-9]{55}|\[`?[A-Z0-9…\.]+`?\]\([^)]*\/(C[A-Z0-9]{55})[^)]*\))/g;
const WASM_HASH_RE = /\|\s*`([^`]+)`\s*\|\s*`([a-f0-9]{64})`/g;

/** Default path: repository `docs/deployments.md` relative to this package. */
export function defaultDeploymentsPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "../../../../docs/deployments.md");
}

/**
 * Parses a deployments markdown document into expected addresses.
 *
 * Stellar contract ids are 56-character `C…` strings. Named rows prefer the
 * address embedded in a stellar.expert link when the cell truncates the id.
 */
export function parseDeployments(markdown: string, path = "<memory>"): DeploymentRecord {
  const addresses = new Set<string>();
  const named: Record<string, string> = {};
  const wasmHashes: string[] = [];

  for (const match of markdown.matchAll(CONTRACT_RE)) {
    const id = match[1];
    if (id !== undefined) {
      addresses.add(id);
    }
  }

  for (const match of markdown.matchAll(NAMED_ROW_RE)) {
    const label = match[1];
    const linked = match[3];
    const bare = match[2]?.startsWith("C") && match[2].length === 56 ? match[2] : undefined;
    const address = linked ?? bare;
    if (label !== undefined && address !== undefined) {
      named[label] = address;
      addresses.add(address);
    }
  }

  for (const match of markdown.matchAll(WASM_HASH_RE)) {
    const hash = match[2];
    if (hash !== undefined) {
      wasmHashes.push(hash);
    }
  }

  return {
    path,
    addresses: [...addresses],
    named,
    wasmHashes,
  };
}

export function loadDeployments(path: string = defaultDeploymentsPath()): DeploymentRecord {
  const markdown = readFileSync(path, "utf8");
  return parseDeployments(markdown, path);
}
