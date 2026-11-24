import { Horizon, Keypair } from "@stellar/stellar-sdk";

import { PUBLIC_PASSPHRASE, TESTNET_PASSPHRASE } from "./network.js";
import { fail, pass, type CheckResult } from "./report.js";

/** Default friendbot / Horizon hosts for the two networks the stack ships. */
export function horizonUrlForPassphrase(passphrase: string): string {
  if (passphrase === TESTNET_PASSPHRASE) {
    return "https://horizon-testnet.stellar.org";
  }
  if (passphrase === PUBLIC_PASSPHRASE) {
    return "https://horizon.stellar.org";
  }
  throw new Error(`no Horizon URL for passphrase ${JSON.stringify(passphrase)}`);
}

export type BalanceRead =
  | { ok: true; balance: number }
  | { ok: false; reason: string; missing?: boolean };

export type AccountLoader = (publicKey: string, horizonUrl: string) => Promise<BalanceRead>;

/**
 * Reads the native balance of an account without submitting a transaction.
 *
 * Horizon `loadAccount` is a GET. The doctor never signs, never builds a
 * payment, and never calls friendbot — funding is an observation, not a fix.
 */
export const loadNativeBalance: AccountLoader = async (publicKey, horizonUrl) => {
  try {
    const server = new Horizon.Server(horizonUrl, { allowHttp: true });
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find((entry) => entry.asset_type === "native");
    if (native === undefined) {
      return { ok: false, reason: "account has no native balance entry" };
    }
    return { ok: true, balance: Number(native.balance) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const missing = /404|not found|NotFound|Resource Missing/i.test(reason);
    return { ok: false, reason, missing };
  }
};

export interface FundingCheckOptions {
  /** Secret key env value — only used to derive the public key. Never signed with. */
  secret: string;
  /** Label for the report line, e.g. CLOCK_SECRET_KEY. */
  name: string;
  passphrase: string;
  /** Minimum native balance in XLM. Default 1. */
  minimumXlm?: number;
  horizonUrl?: string;
  /** Override Horizon load (tests). Defaults to a read-only Horizon GET. */
  loadAccount?: AccountLoader;
}

/**
 * Confirms the account derived from a service secret is funded.
 *
 * The secret is read only to call `Keypair.fromSecret` and take the public
 * key. No `sign`, no `submitTransaction`, no friendbot.
 */
export async function checkFunding(options: FundingCheckOptions): Promise<CheckResult> {
  const minimum = options.minimumXlm ?? 1;
  let publicKey: string;
  try {
    publicKey = Keypair.fromSecret(options.secret).publicKey();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail("funding", options.name, `secret key is invalid (${reason})`);
  }

  const horizonUrl = options.horizonUrl ?? horizonUrlForPassphrase(options.passphrase);
  const loader = options.loadAccount ?? loadNativeBalance;
  const balance = await loader(publicKey, horizonUrl);

  if (!balance.ok) {
    if (balance.missing) {
      return fail(
        "funding",
        options.name,
        `account ${publicKey} is not on the network (Horizon ${horizonUrl}). Fund it before starting the service.`,
      );
    }
    return fail(
      "funding",
      options.name,
      `could not read balance for ${publicKey} (${balance.reason})`,
    );
  }

  if (balance.balance < minimum) {
    return fail(
      "funding",
      options.name,
      `account ${publicKey} has ${balance.balance} XLM; need at least ${minimum} XLM.`,
    );
  }

  return pass(
    "funding",
    options.name,
    `account ${publicKey} funded (${balance.balance} XLM)`,
  );
}
