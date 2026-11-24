import { describe, expect, it } from "vitest";

import { checkContractAddress, checkContractEnv } from "../../src/doctor/contracts.js";
import { parseDeployments } from "../../src/doctor/deployments.js";

const CORE = "CDANGHBE63NZCE635GWIDXXCDVM2QM64EMXSOAYSUI5SQM7CHCPTUHUM";
const VAULT = "CCYPGWR3WEGMGWKSE3TWW2YZKCONEIJ3R6PWMVJDBT6JJVU6QSASNNFL";
const OTHER = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

const deployments = parseDeployments(`
| Instance | Address |
|---|---|
| \`hackathon-core\` | [\`CDANGHBE…\`](https://stellar.expert/explorer/testnet/contract/${CORE}) |
| \`prize-vault\` | [\`CCYPGWR3…\`](https://stellar.expert/explorer/testnet/contract/${VAULT}) |
`);

/**
 * Contract address checks bind a configured id to the published deployment record.
 *
 * The property under defence is that an unset watch list stays optional, while
 * a set address that is not in deployments.md fails with the contracts class.
 */
describe("contract address against deployments", () => {
  it("skips an unset address", () => {
    expect(checkContractAddress("WATCH_CONTRACT", undefined, deployments)).toBeNull();
    expect(checkContractAddress("WATCH_CONTRACT", "", deployments)).toBeNull();
  });

  it("passes when the address is listed in the deployment record", () => {
    const result = checkContractAddress("WATCH_CONTRACT", CORE, deployments);

    expect(result?.ok).toBe(true);
    expect(result?.class).toBe("contracts");
  });

  it("fails the contracts class when the address is unknown", () => {
    const result = checkContractAddress("WATCH_CONTRACT", OTHER, deployments);

    expect(result?.ok).toBe(false);
    expect(result?.class).toBe("contracts");
    expect(result?.message).toMatch(/does not match the deployment record/);
  });

  it("checks several env vars and ignores the unset ones", () => {
    const results = checkContractEnv(
      { WATCH_CONTRACT: CORE, OTHER_CONTRACT: undefined },
      deployments,
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.ok).toBe(true);
  });
});
