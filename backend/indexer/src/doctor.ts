import { config } from "dotenv";

import { mainServiceDoctor } from "@stelhacks/shared/doctor";

config({ path: new URL("../../.env.local", import.meta.url).pathname, quiet: true });

/**
 * Configuration doctor for the indexer.
 *
 * Reads environment, checks the network story, probes RPC, and verifies any
 * configured watch contract against `docs/deployments.md`. Does not follow
 * ledgers and does not write to Postgres.
 */
await mainServiceDoctor({
  service: "indexer",
  requiredEnv: [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STELLAR_RPC_URL",
    "STELLAR_NETWORK_PASSPHRASE",
  ],
  contractEnv: {
    WATCH_CONTRACT: process.env["WATCH_CONTRACT"],
  },
});
