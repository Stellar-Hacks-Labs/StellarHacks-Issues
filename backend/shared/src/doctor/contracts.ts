import type { DeploymentRecord } from "./deployments.js";
import { fail, pass, type CheckResult } from "./report.js";

/**
 * Checks a configured contract address against the deployment record.
 *
 * An empty value is skipped: optional watch lists stay optional. A value that
 * is set must appear in `docs/deployments.md`, otherwise the service would
 * follow a contract this repository has never published.
 */
export function checkContractAddress(
  name: string,
  address: string | undefined,
  deployments: DeploymentRecord,
): CheckResult | null {
  if (address === undefined || address === "") {
    return null;
  }

  if (!/^C[A-Z0-9]{55}$/.test(address)) {
    return fail(
      "contracts",
      name,
      `is not a Stellar contract id (got ${JSON.stringify(address)}).`,
    );
  }

  if (!deployments.addresses.includes(address)) {
    const hint =
      deployments.addresses.length === 0
        ? "deployments.md lists no contract addresses"
        : `expected one of ${deployments.addresses.join(", ")}`;
    return fail(
      "contracts",
      name,
      `does not match the deployment record (got ${address}; ${hint}).`,
    );
  }

  return pass("contracts", name, `matches deployments.md (${address})`);
}

/**
 * Checks several optional contract env vars, ignoring ones that are unset.
 */
export function checkContractEnv(
  vars: Readonly<Record<string, string | undefined>>,
  deployments: DeploymentRecord,
): CheckResult[] {
  const results: CheckResult[] = [];
  for (const [name, value] of Object.entries(vars)) {
    const result = checkContractAddress(name, value, deployments);
    if (result !== null) {
      results.push(result);
    }
  }
  return results;
}
