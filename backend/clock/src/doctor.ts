import { config } from "dotenv";

import { mainServiceDoctor } from "@stelhacks/shared/doctor";

config({ path: new URL("../../.env.local", import.meta.url).pathname, quiet: true });

/**
 * Configuration doctor for the clock.
 *
 * The clock's key pays fees and nothing else. This check confirms the account
 * exists and holds lumens, and that the network passphrase matches the RPC
 * host, without calling `advance_phase` or any other entry point.
 */
await mainServiceDoctor({
  service: "clock",
  requiredEnv: [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STELLAR_RPC_URL",
    "STELLAR_NETWORK_PASSPHRASE",
    "CLOCK_SECRET_KEY",
  ],
  fundingSecrets: ["CLOCK_SECRET_KEY"],
});
