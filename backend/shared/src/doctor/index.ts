export {
  checkRequiredEnv,
  envPresent,
  requireEnv,
} from "./env.js";
export {
  TESTNET_PASSPHRASE,
  PUBLIC_PASSPHRASE,
  expectedPassphraseForRpc,
  checkNetworkPassphrase,
} from "./network.js";
export { probeRpc, checkRpc } from "./rpc.js";
export {
  type DeploymentRecord,
  defaultDeploymentsPath,
  parseDeployments,
  loadDeployments,
} from "./deployments.js";
export { checkContractAddress, checkContractEnv } from "./contracts.js";
export {
  horizonUrlForPassphrase,
  loadNativeBalance,
  checkFunding,
} from "./funding.js";
export {
  type FailureClass,
  type CheckResult,
  type DoctorReport,
  reportOk,
  formatReport,
  printReport,
  pass,
  fail,
} from "./report.js";

import { checkContractEnv } from "./contracts.js";
import { loadDeployments, type DeploymentRecord } from "./deployments.js";
import { checkRequiredEnv } from "./env.js";
import { checkFunding } from "./funding.js";
import { checkNetworkPassphrase } from "./network.js";
import { type CheckResult, type DoctorReport, printReport } from "./report.js";
import { checkRpc, type RpcProbe } from "./rpc.js";

export interface ServiceDoctorOptions {
  service: string;
  /** Environment variables that must be present. */
  requiredEnv: readonly string[];
  /**
   * Optional contract address env vars. Unset values are skipped; set values
   * must appear in the deployment record.
   */
  contractEnv?: Readonly<Record<string, string | undefined>>;
  /**
   * Secret-key env names whose accounts must be funded. Each secret is used
   * only to derive a public key — never to sign.
   */
  fundingSecrets?: readonly string[];
  /** Override deployments.md path (tests). */
  deploymentsPath?: string;
  /** Pre-parsed deployments (tests). */
  deployments?: DeploymentRecord;
  env?: NodeJS.ProcessEnv;
  /** Override RPC probe (tests). */
  rpcProbe?: RpcProbe;
  /** Minimum XLM for funding checks. */
  minimumXlm?: number;
}

/**
 * Runs the shared doctor sequence for one service.
 *
 * Order matches how an operator debugs a cold start: missing env first, then
 * the network story, then whether RPC answers, then whether any configured
 * contract is one this repository deployed, then whether fee-paying accounts
 * have lumens. Nothing in this path submits a transaction.
 */
export async function runServiceDoctor(
  options: ServiceDoctorOptions,
): Promise<DoctorReport> {
  const env = options.env ?? process.env;
  const results: CheckResult[] = [];

  results.push(...checkRequiredEnv(options.requiredEnv, env));

  const rpcUrl = env["STELLAR_RPC_URL"];
  const passphrase = env["STELLAR_NETWORK_PASSPHRASE"];

  if (rpcUrl && passphrase) {
    results.push(checkNetworkPassphrase(passphrase, rpcUrl));
    results.push(await checkRpc(rpcUrl, options.rpcProbe));
  }

  const deployments =
    options.deployments ??
    loadDeployments(options.deploymentsPath);

  if (options.contractEnv !== undefined) {
    results.push(...checkContractEnv(options.contractEnv, deployments));
  }

  if (options.fundingSecrets !== undefined && passphrase) {
    for (const name of options.fundingSecrets) {
      const secret = env[name];
      if (secret === undefined || secret === "") {
        continue;
      }
      results.push(
        await checkFunding({
          secret,
          name,
          passphrase,
          minimumXlm: options.minimumXlm,
        }),
      );
    }
  }

  return { service: options.service, results };
}

/** Convenience entry used by each service's `doctor.ts`. */
export async function mainServiceDoctor(
  options: ServiceDoctorOptions,
): Promise<never> {
  const report = await runServiceDoctor(options);
  const code = printReport(report);
  process.exit(code);
}
