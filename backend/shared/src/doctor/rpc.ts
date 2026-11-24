import { fail, pass, type CheckResult } from "./report.js";

export type RpcHealth = { latestLedger: number };

export type RpcProbe = (
  rpcUrl: string,
) => Promise<{ ok: true; health: RpcHealth } | { ok: false; reason: string }>;

/**
 * Probes RPC reachability without submitting a transaction.
 *
 * A bare JSON-RPC `getHealth` POST — no signing, no simulation, no submit.
 * Implemented with `fetch` rather than `rpc.Server` so the doctor owns the
 * transport and tests can inject a probe without fighting axios.
 */
export const probeRpc: RpcProbe = async (rpcUrl) => {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
    });

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const body = (await response.json()) as {
      result?: { latestLedger?: number; status?: string };
      error?: { message?: string };
    };

    if (body.error !== undefined) {
      return { ok: false, reason: body.error.message ?? "json-rpc error" };
    }

    const latestLedger = body.result?.latestLedger;
    if (typeof latestLedger !== "number") {
      return { ok: false, reason: "getHealth response missing latestLedger" };
    }

    return { ok: true, health: { latestLedger } };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, reason };
  }
};

export async function checkRpc(
  rpcUrl: string,
  probe: RpcProbe = probeRpc,
): Promise<CheckResult> {
  const probed = await probe(rpcUrl);
  if (!probed.ok) {
    return fail("rpc", "STELLAR_RPC_URL", `unreachable (${probed.reason})`);
  }
  return pass(
    "rpc",
    "STELLAR_RPC_URL",
    `reachable, latest ledger ${probed.health.latestLedger}`,
  );
}
