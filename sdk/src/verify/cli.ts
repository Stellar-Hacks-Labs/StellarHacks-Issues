#!/usr/bin/env node
/**
 * Independent verifier CLI entry point.
 *
 * Given a contract address (or an offline fixture), recompute the ranking and
 * payouts from public data and print a structured report of any disagreement.
 */

import { helpText, parseArgs } from "./args.js";
import { checkBallotTallies } from "./ballots.js";
import type { Check } from "./compare.js";
import { checkConstitution } from "./constitution.js";
import { disclosuresFromEvents } from "./disclosures.js";
import { checkPayouts } from "./payouts.js";
import { checkRankings, recomputeRankings } from "./ranking.js";
import { buildReport, formatJson, formatText } from "./report.js";
import { checkRoots } from "./roots.js";
import { loadHackathon } from "./rpc.js";
import { checkClaimedRound } from "./tlock.js";

export async function run(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.help) {
    process.stdout.write(helpText());
    return 0;
  }

  const loaded = await loadHackathon({
    contractId: args.contractId,
    rpcUrl: args.rpcUrl,
    networkPassphrase: args.networkPassphrase,
    statePath: args.statePath,
    eventsPath: args.eventsPath,
  });

  const disclosures =
    loaded.disclosures.scorecards.length > 0 || loaded.disclosures.ballots.length > 0
      ? loaded.disclosures
      : disclosuresFromEvents(loaded.events);

  const checks: Check[] = [];
  checks.push(
    checkConstitution({
      constitution: loaded.constitution,
      publishedHash: loaded.publishedHash,
    }),
  );

  if (disclosures.scorecards.length > 0 || disclosures.ballots.length > 0) {
    checks.push(...checkRoots(disclosures, loaded.roots));
  }

  if (disclosures.ballots.length > 0 && Object.keys(loaded.voteWeights).length > 0) {
    checks.push(
      ...checkBallotTallies(disclosures, loaded.voteWeights, loaded.constitution),
    );
  }

  checks.push(
    ...checkRankings(
      {
        constitution: loaded.constitution,
        projects: loaded.projects,
        topVotes: loaded.topVotes,
        disclosures,
      },
      { rankings: loaded.rankings },
    ),
  );

  const rankings = recomputeRankings({
    constitution: loaded.constitution,
    projects: loaded.projects,
    topVotes: loaded.topVotes,
    disclosures,
  });

  if (loaded.payouts.payouts.length > 0) {
    checks.push(...checkPayouts(loaded.constitution, rankings, loaded.payouts));
  }

  if (loaded.tlock !== undefined && loaded.tlock.claimedRound > 0) {
    const tlock = checkClaimedRound(loaded.tlock.judgingClosesAt, loaded.tlock.claimedRound);
    checks.push({
      name: "tlock.round",
      ok: tlock.ok,
      expected: tlock.expectedRound,
      actual: tlock.claimedRound,
      detail: tlock.ok ? undefined : "tlock.round disagrees",
    });
  }

  const report = buildReport(loaded.contractId, checks);
  process.stdout.write(args.format === "json" ? formatJson(report) : formatText(report));

  return report.ok ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith("/verify/cli.js") ||
    process.argv[1].endsWith("/verify/cli.ts") ||
    process.argv[1].includes("stelhacks-verify"));

if (invokedDirectly) {
  run(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 2;
    },
  );
}
