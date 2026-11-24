import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ChainSnapshot, ConsistencyReport, ProjectionSnapshot } from "../src/compare.js";
import type { DetectedGap } from "../src/gaps.js";
import type { ReingestPass } from "../src/reingest.js";
import type { LedgerRange } from "../src/ranges.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");

function load<T>(name: string): T {
  return JSON.parse(readFileSync(join(dataDir, name), "utf8")) as T;
}

export interface GapFixture {
  covered: LedgerRange[];
  cursor: number;
  oldestRpc: number;
  origin?: number;
  expectedGaps: DetectedGap[];
}

export interface DuplicateRangeFixture {
  first: ReingestPass;
  second: ReingestPass;
}

export interface DivergentStateFixture {
  projected: ProjectionSnapshot;
  onChain: ChainSnapshot;
  expectedMismatches: ConsistencyReport["mismatches"];
}

export const contiguous = (): GapFixture => load("contiguous.json");
export const gapped = (): GapFixture => load("gapped.json");
export const rpcRetentionEdge = (): GapFixture => load("rpc-retention-edge.json");
export const duplicateRange = (): DuplicateRangeFixture => load("duplicate-range.json");
export const divergentState = (): DivergentStateFixture => load("divergent-state.json");
