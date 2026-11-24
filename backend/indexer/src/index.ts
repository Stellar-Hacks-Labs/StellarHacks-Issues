import { newCorrelationId, withCorrelationId } from "@stelhacks/shared";
import { rpc } from "@stellar/stellar-sdk";

import { parseArgs, usage } from "./commands.js";
import { settings } from "./config.js";
import { describeCheck, runConsistencyCheck } from "./consistency.js";
import { explain, fellOffTheWindow } from "./errors.js";
import { advanceTo, noteProgress, resumeFrom, rewind } from "./cursor.js";
import { decode } from "./decode.js";
import { detectGaps, recordGaps } from "./gaps.js";
import { health, log, metrics, tracker } from "./health.js";
import { read, replayable, store } from "./ingest.js";
import { project } from "./project.js";
import { merge, type LedgerRange } from "./ranges.js";
import { formatGaps } from "./report.js";
import { reingest } from "./reingest.js";
import { db } from "./supabase.js";
import { apply, discard } from "./write.js";
import { deliverLifecycleNotifications } from "./notify/index.js";

/**
 * Soroban events into Postgres, and nothing else.
 *
 * The shape of one pass is the whole design. Read a range from the chain, write
 * the log, move the cursor, then rebuild the projections from the log. The
 * projections are rebuilt from the log rather than from the range that just
 * arrived, which is slower and is the point: it means the rows in the database
 * are always exactly what the log says, never the accumulated result of every
 * pass that happened to run.
 *
 *   indexer                          follow every hackathon, forever
 *   indexer <contract id>            follow one, forever
 *   indexer <contract id> --once     one pass, then stop
 *   indexer <contract id> --rebuild  throw the projections away and rebuild
 *   indexer <contract id> --detect-gaps
 *   indexer <contract id> --reingest <from> <to>
 *   indexer <contract id> --check
 *
 * Called with nothing, the list is the `hackathons` table rather than a setting.
 * It was one contract named in the environment, which is fine while there is
 * one and wrong the moment there are two: the second hackathon somebody creates
 * has a real deadline read from the chain and no phase read from here, so the
 * product shows it as never published. Naming the source of truth instead means
 * a hackathon created in the browser is followed without anybody editing a file
 * and restarting anything.
 */

const server = new rpc.Server(settings.rpcUrl);

async function pass(contract: string): Promise<number> {
  const from = await resumeFrom(contract);
  const found = await read(contract, from);

  /*
    Nothing arrived, so nothing derived from it can have moved.

    The projection used to be rebuilt here on every lap, including the
    overwhelming majority that find no new ledgers: an idle indexer downloaded
    the whole history of every hackathon it follows, every few seconds,
    forever. On a free tier that single line was the product's entire hosting
    bill. It now runs from `reproject`, and only once something has landed.

    The cursor still moves. It records how far the chain has been scanned rather
    than how much was found, and leaving it behind would mean rescanning the
    same ledgers until they aged out of the node's window.
  */
  if (found.events.length === 0 && found.reads.length === 0) {
    await noteProgress(contract, found.through);

    return 0;
  }

  await store(contract, found);

  // The cursor moves only after the rows it covers have landed. Ahead of them
  // it would skip a range on the next restart, and a skipped range is a gap no
  // later pass would think to look for.
  await advanceTo(contract, found.through);

  return found.events.length;
}

/*
  The projection is rebuilt from the whole log, so what it costs grows with the
  log. Run once per pass that found something, it was paid again for every page
  RPC handed back: an indexer catching up on a busy hackathon read its entire
  history once per page, and the total grew with the square of the event count.

  So the log is written as it arrives and the projection waits until the
  indexer has reached the head of the chain, then runs once for everything that
  landed. A contract not seen yet by this process counts as unprojected, which
  covers a restart between a store and the rebuild that should have followed.
*/
const projected = new Set<string>();

/* Within a minute of the head, at five seconds a ledger. Close enough that one
   more lap would add nothing a page could show. */
const NEAR_THE_HEAD = 12;

async function reproject(contract: string): Promise<void> {
  const stored = await replayable(contract);
  const events = decode(stored.events);
  await apply(project(events, stored.reads));
  await deliverLifecycleNotifications(events);
  projected.add(contract);
}

async function rebuild(contract: string): Promise<void> {
  log.info("rebuilding from the log", { contract });

  await discard(contract);
  await rewind(contract);

  const stored = await replayable(contract);
  await apply(project(decode(stored.events), stored.reads));

  log.info("rebuilt from the log", {
    contract,
    events: stored.events.length,
    reads: stored.reads.length,
  });
}

/**
 * Covered ranges inferred from stored events.
 *
 * Contiguous event ledgers collapse into one range. A missing ledger between
 * two events is not itself a gap — events are sparse — so this cover is only a
 * lower bound on what was scanned. Combined with the cursor it is still enough
 * to spot a cursor that jumped past a stretch nobody asked RPC about.
 */
async function coveredFromEvents(contract: string): Promise<LedgerRange[]> {
  const { data, error } = await db
    .from("chain_events")
    .select("ledger")
    .eq("contract_id", contract)
    .order("ledger", { ascending: true });

  if (error !== null) {
    throw new Error(`could not read event ledgers: ${error.message}`);
  }

  const ledgers = [...new Set((data ?? []).map((row) => Number(row.ledger)))].sort((a, b) => a - b);

  if (ledgers.length === 0) {
    return [];
  }

  const ranges: LedgerRange[] = [];
  let from = ledgers[0]!;
  let to = from;

  for (let index = 1; index < ledgers.length; index += 1) {
    const ledger = ledgers[index]!;

    if (ledger === to + 1) {
      to = ledger;
      continue;
    }

    ranges.push({ from, to });
    from = ledger;
    to = ledger;
  }

  ranges.push({ from, to });

  return merge(ranges);
}

async function detectAndRecordGaps(contract: string): Promise<void> {
  const [cursor, node, covered] = await Promise.all([
    resumeFrom(contract),
    server.getHealth(),
    coveredFromEvents(contract),
  ]);

  /*
    A healthy cursor claims a continuous scan from the first stored event to
    itself. Sparse events must not look like holes, so that claim is one range.
    When the cursor has fallen behind retention the continuous claim is a lie —
    fall back to the event clumps we still hold and let detectGaps name both
    the irreparable stretch and any hole inside the clumps.
  */
  const origin = covered[0]?.from;
  const scanCover =
    origin !== undefined && cursor >= node.oldestLedger
      ? [{ from: origin, to: Math.max(origin, cursor) }]
      : covered;

  const gaps = detectGaps({
    covered: scanCover,
    cursor,
    oldestRpc: node.oldestLedger,
    origin,
  });

  const written = await recordGaps(contract, gaps);
  log.info("gap detection finished", {
    contract,
    summary: formatGaps(gaps),
    recorded: written,
  });
}

/**
 * Every hackathon the product knows about, re-read now and then.
 *
 * Read from the table rather than taken once at startup, so a hackathon
 * created while this is running is followed without a restart. Held for a few
 * minutes between reads, because the alternative was asking on every lap, and
 * on a database of thirty megabytes that question was the largest thing this
 * service sent anywhere.
 */
let watched: { at: number; contracts: string[] } | null = null;

async function watching(): Promise<string[]> {
  const now = Date.now();

  if (watched !== null && now - watched.at < settings.watchedForMs) {
    return watched.contracts;
  }

  const { data, error } = await db.from("hackathons").select("contract_id");

  if (error !== null) {
    log.error("could not read the hackathons to follow", { error: error.message });

    /* The list we already had, rather than none. A failed read is a reason to
       carry on following what was already being followed; returning nothing
       would quietly stop indexing every hackathon until the next lap. */
    return watched?.contracts ?? [];
  }

  const contracts = (data ?? []).map((row) => String(row.contract_id));
  watched = { at: now, contracts };

  return contracts;
}

async function follow(only: string | undefined): Promise<never> {
  for (;;) {
    await withCorrelationId(newCorrelationId(), async () => {
      const contracts = only === undefined ? await watching() : [only];
      let catchingUp = false;
      let tickError: unknown = null;
      let worstLag = 0;

      for (const contract of contracts) {
        try {
          const found = await pass(contract);
          const behind = await health(contract);

          if (found > 0) {
            metrics.increment("events_ingested", found);
            projected.delete(contract);
          }

          worstLag = Math.max(worstLag, behind.lag);
          tracker.setLag(worstLag);

          if (behind.lag > NEAR_THE_HEAD) {
            catchingUp = true;
          } else if (!projected.has(contract)) {
            await reproject(contract);
          }

          if (behind.strandedBehindRetention) {
            // Saying this every pass is deliberate. It is the one condition
            // running longer does not fix, and an indexer that quietly kept up
            // from a point past the gap would look healthy while missing
            // everything before it.
            log.error("stranded behind RPC retention", {
              contract,
              cursor: behind.cursor,
            });
          }

          if (behind.openGapCount > 0 || behind.consistency.ok === false) {
            log.error("recovery signals still open", {
              contract,
              openGaps: behind.openGapCount,
              consistency:
                behind.consistency.ok === null
                  ? "unchecked"
                  : behind.consistency.ok
                    ? "ok"
                    : "mismatch",
            });
          }

          if (found > 0 || behind.lag > 0) {
            log.info("ingest pass", {
              contract,
              ingested: found,
              lag: behind.lag,
              latest: behind.latest,
            });
          }
        } catch (thrown) {
          /*
            One contract's failure is not the others'.

            A hackathon whose events RPC has aged out would otherwise stop the
            loop and with it every event still arriving for every other
            hackathon. It is reported and skipped, and the next lap tries it
            again.
          */
          tickError = thrown;
          const message = fellOffTheWindow(thrown)
            ? "stranded, its events are older than anything RPC still serves"
            : explain(thrown);
          log.error("ingest pass failed", { contract, error: message });
        }
      }

      if (tickError !== null) {
        tracker.noteError(tickError);
      } else {
        tracker.noteSuccess();
      }

      if (contracts.length === 0) {
        log.info("no hackathons to follow yet");
      }

      /* Straight on while anything is behind, so a backlog clears at the speed
         RPC serves it. At the head, a lap a minute whether or not the last one
         found events: that is what keeps the rebuild above to once a minute for
         a busy hackathon instead of once per event. */
      if (!catchingUp) {
        await new Promise((wake) => setTimeout(wake, settings.idleMs));
      }
    });
  }
}

let command;

try {
  command = parseArgs(process.argv.slice(2));
} catch (thrown) {
  log.error(explain(thrown));
  process.exit(1);
}

switch (command.kind) {
  case "rebuild":
    await rebuild(command.contract);
    break;
  case "once": {
    const found = await pass(command.contract);
    if (found > 0) {
      metrics.increment("events_ingested", found);
    }
    await reproject(command.contract);
    const behind = await health(command.contract);
    tracker.setLag(behind.lag);
    tracker.noteSuccess();

    log.info("one-shot ingest finished", {
      contract: command.contract,
      ingested: found,
      lag: behind.lag,
      latest: behind.latest,
    });
    break;
  }
  case "detect-gaps":
    await detectAndRecordGaps(command.contract);
    break;
  case "reingest": {
    const result = await reingest(command.contract, command.from, command.to);
    await reproject(command.contract);
    if (result.events > 0) {
      metrics.increment("events_ingested", result.events);
    }
    log.info("re-ingest finished", {
      contract: command.contract,
      from: result.range.from,
      to: result.range.to,
      events: result.events,
      reads: result.reads,
      pages: result.pages,
      resolvedGaps: result.resolvedGaps,
      clamped: result.clamped,
    });
    break;
  }
  case "check": {
    const run = await runConsistencyCheck(command.contract);
    log.info(describeCheck(run));
    if (!run.report.ok) {
      process.exitCode = 2;
    }
    break;
  }
  case "follow":
    await follow(command.contract);
    break;
  default: {
    log.error(usage());
    process.exit(1);
  }
}
