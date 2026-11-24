import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadHackathon, type LoadedHackathon } from "../../src/verify/rpc.js";

const fixturesRoot = join(import.meta.dirname, "..", "..", "..", "fixtures", "verify");

export function referenceStatePath(): string {
  return join(fixturesRoot, "reference-state.json");
}

export function referenceEventsPath(): string {
  return join(fixturesRoot, "reference-events.json");
}

export function tamperedStatePath(): string {
  return join(fixturesRoot, "tampered-state.json");
}

export async function loadReference(): Promise<LoadedHackathon> {
  return loadHackathon({
    contractId: "fixture",
    rpcUrl: "",
    networkPassphrase: "",
    statePath: referenceStatePath(),
    eventsPath: referenceEventsPath(),
  });
}

export async function loadTampered(): Promise<LoadedHackathon> {
  return loadHackathon({
    contractId: "fixture",
    rpcUrl: "",
    networkPassphrase: "",
    statePath: tamperedStatePath(),
    eventsPath: referenceEventsPath(),
  });
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}
