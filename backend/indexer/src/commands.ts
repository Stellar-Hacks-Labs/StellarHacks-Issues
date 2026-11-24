/**
 * Parsing the maintenance flags the indexer accepts on the command line.
 *
 * Kept in its own module so the flag grammar can be tested without starting a
 * follow loop or touching the network.
 */

export type Command =
  | { kind: "follow"; contract: string | undefined }
  | { kind: "once"; contract: string }
  | { kind: "rebuild"; contract: string }
  | { kind: "detect-gaps"; contract: string }
  | { kind: "reingest"; contract: string; from: number; to: number }
  | { kind: "check"; contract: string };

export function usage(): string {
  return [
    "usage:",
    "  indexer                                   follow every hackathon",
    "  indexer <contract>                        follow one",
    "  indexer <contract> --once                 one pass",
    "  indexer <contract> --rebuild              rebuild projections from the log",
    "  indexer <contract> --detect-gaps          record ledger holes vs the cursor",
    "  indexer <contract> --reingest <from> <to> re-read a bounded ledger range",
    "  indexer <contract> --check                compare projections with contract state",
  ].join("\n");
}

/**
 * Turns argv (already without the runtime) into a single command.
 *
 * Unknown flags fail loudly. A quiet default to `follow` would hide a typo and
 * leave an operator watching a process that never ran the check they asked for.
 */
export function parseArgs(argv: readonly string[]): Command {
  if (argv.length === 0) {
    return { kind: "follow", contract: undefined };
  }

  const [first, ...rest] = argv;

  if (first === undefined) {
    return { kind: "follow", contract: undefined };
  }

  if (first.startsWith("--")) {
    throw new Error(`contract id required before ${first}\n${usage()}`);
  }

  const contract = first;

  if (rest.length === 0) {
    return { kind: "follow", contract };
  }

  const [flag, a, b] = rest;

  switch (flag) {
    case "--once":
      return { kind: "once", contract };
    case "--rebuild":
      return { kind: "rebuild", contract };
    case "--detect-gaps":
      return { kind: "detect-gaps", contract };
    case "--check":
      return { kind: "check", contract };
    case "--reingest": {
      if (a === undefined || b === undefined) {
        throw new Error(`--reingest needs <from> <to>\n${usage()}`);
      }

      const from = Number(a);
      const to = Number(b);

      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0) {
        throw new Error(`--reingest bounds must be non-negative integers, got ${a} ${b}`);
      }

      return { kind: "reingest", contract, from, to };
    }
    default:
      throw new Error(`unknown mode ${flag}\n${usage()}`);
  }
}
