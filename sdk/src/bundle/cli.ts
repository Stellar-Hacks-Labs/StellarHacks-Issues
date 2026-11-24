#!/usr/bin/env node
/**
 * Check an evidence bundle from the command line.
 *
 * Usage: `node dist/bundle/cli.js check path/to/bundle.zip`
 *
 * Exit 0 when every digest matches. Exit 1 with one error per line otherwise.
 * The mode exists so a reader can verify a zip without opening a browser or an
 * RPC connection.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { checkBundle } from "./check.js";

export function main(argv: string[] = process.argv.slice(2)): number {
  const [command, path] = argv;

  if (command !== "check" || path === undefined) {
    process.stderr.write("usage: stelhacks-bundle check <bundle.zip>\n");
    return 2;
  }

  const bytes = new Uint8Array(readFileSync(path));
  const result = checkBundle(bytes);

  if (result.ok) {
    process.stdout.write(`ok ${result.contractId ?? ""}\n`.trimEnd() + "\n");
    return 0;
  }

  for (const error of result.errors) {
    process.stderr.write(`${error}\n`);
  }

  return 1;
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  process.exitCode = main();
}
