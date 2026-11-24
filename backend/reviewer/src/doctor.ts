import { config } from "dotenv";

import { mainServiceDoctor } from "@stelhacks/shared/doctor";

config({ path: new URL("../../.env.local", import.meta.url).pathname, quiet: true });

/**
 * Configuration doctor for the reviewer.
 *
 * Confirms the API keys and network settings the queue needs before a run is
 * requested. Does not call Anthropic, GitHub, or any contract entry point.
 */
await mainServiceDoctor({
  service: "reviewer",
  requiredEnv: [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STELLAR_RPC_URL",
    "STELLAR_NETWORK_PASSPHRASE",
    "GITHUB_TOKEN",
    "ANTHROPIC_API_KEY",
  ],
});
