/**
 * CLI argument parsing for the independent verifier.
 *
 * Kept separate from the runner so tests can feed a argv vector without
 * touching process globals, and so the help text lives next to the flags.
 */

export type OutputFormat = "text" | "json";

export interface VerifyArgs {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
  format: OutputFormat;
  /** Offline state snapshot; when set, no RPC call is made. */
  statePath?: string;
  /** Offline event log paired with a state snapshot. */
  eventsPath?: string;
  help: boolean;
}

const TESTNET_RPC = "https://soroban-testnet.stellar.org";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const PUBLIC_RPC = "https://mainnet.sorobanrpc.com";
const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";

export function parseArgs(argv: readonly string[]): VerifyArgs {
  const args: VerifyArgs = {
    contractId: "",
    rpcUrl: TESTNET_RPC,
    networkPassphrase: TESTNET_PASSPHRASE,
    format: "text",
    help: false,
  };

  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]!;

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--format") {
      const value = argv[++index];
      if (value !== "text" && value !== "json") {
        throw new Error("--format must be text or json");
      }
      args.format = value;
      continue;
    }

    if (token === "--rpc") {
      args.rpcUrl = required(argv[++index], "--rpc");
      continue;
    }

    if (token === "--network") {
      const value = required(argv[++index], "--network");
      if (value === "testnet") {
        args.rpcUrl = TESTNET_RPC;
        args.networkPassphrase = TESTNET_PASSPHRASE;
      } else if (value === "public" || value === "mainnet") {
        args.rpcUrl = PUBLIC_RPC;
        args.networkPassphrase = PUBLIC_PASSPHRASE;
      } else {
        throw new Error("--network must be testnet or public");
      }
      continue;
    }

    if (token === "--passphrase") {
      args.networkPassphrase = required(argv[++index], "--passphrase");
      continue;
    }

    if (token === "--state") {
      args.statePath = required(argv[++index], "--state");
      continue;
    }

    if (token === "--events") {
      args.eventsPath = required(argv[++index], "--events");
      continue;
    }

    if (token === "--contract") {
      args.contractId = required(argv[++index], "--contract");
      continue;
    }

    if (token.startsWith("-")) {
      throw new Error(`unknown flag ${token}`);
    }

    positionals.push(token);
  }

  if (args.contractId === "" && positionals[0] !== undefined) {
    args.contractId = positionals[0];
  }

  if (!args.help && args.contractId === "" && args.statePath === undefined) {
    throw new Error("a contract id or --state fixture is required");
  }

  if (args.contractId === "" && args.statePath !== undefined) {
    args.contractId = "fixture";
  }

  return args;
}

export function helpText(): string {
  return `Usage: stelhacks-verify <contract-id> [options]

Recompute a hackathon result from public chain data and report disagreements.

Options:
  --contract <id>       Contract address (or pass as the first positional)
  --network testnet|public
  --rpc <url>           Soroban RPC endpoint
  --passphrase <text>   Network passphrase
  --state <path>        Offline state fixture (no network)
  --events <path>       Offline events fixture
  --format text|json    Report format (default: text)
  -h, --help            Show this help
`;
}

function required(value: string | undefined, flag: string): string {
  if (value === undefined || value === "") {
    throw new Error(`${flag} needs a value`);
  }

  return value;
}
