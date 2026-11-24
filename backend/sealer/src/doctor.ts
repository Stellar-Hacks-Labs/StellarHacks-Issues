import { config } from "dotenv";

import { mainServiceDoctor } from "@stelhacks/shared/doctor";

config({ path: new URL("../../.env.local", import.meta.url).pathname, quiet: true });

/**
 * Configuration doctor for the sealer.
 *
 * Confirms the sealer secret derives a funded account and that RPC answers,
 * without sealing a card or publishing a root. The secret is used only to
 * derive the public key for the Horizon balance read.
 */
await mainServiceDoctor({
  service: "sealer",
  requiredEnv: [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STELLAR_RPC_URL",
    "STELLAR_NETWORK_PASSPHRASE",
    "SEALER_SECRET_KEY",
  ],
  fundingSecrets: ["SEALER_SECRET_KEY"],
});
