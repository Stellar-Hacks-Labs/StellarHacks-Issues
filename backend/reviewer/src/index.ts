import { newCorrelationId, withCorrelationId } from "@stelhacks/shared";

import { settings } from "./config.js";
import { nextRun } from "./db.js";
import { log, tracker } from "./health.js";
import { carryOut } from "./review.js";

/**
 * The reviewer.
 *
 * Waits for a judge or an organizer to ask for a run, then carries it out: every
 * valid submission, or the ones they picked, read and scored against the frozen
 * rubric. Nothing it writes decides anything. It does not enter the ranking,
 * does not move money and never removes a project; it gives the judges an
 * ordered list and a reason for every number in it.
 *
 *   reviewer             keep watching the queue
 *   reviewer --once      carry out whatever is queued, then stop
 *
 * Losing it loses nothing but time. A run it was carrying is picked up again on
 * the next start, and the projects it already wrote are not sent twice.
 */

async function drain(): Promise<void> {
  const started = Date.now();

  for (let run = await nextRun(); run !== null; run = await nextRun()) {
    await carryOut(run);
  }

  tracker.setLag(Math.max(0, Date.now() - started));
  tracker.noteSuccess();
}

if (process.argv.includes("--once")) {
  await withCorrelationId(newCorrelationId(), () => drain());
} else {
  log.info("watching the review queue", {
    everyMs: settings.everyMs,
    model: settings.model,
  });

  for (;;) {
    await withCorrelationId(newCorrelationId(), async () => {
      try {
        await drain();
      } catch (thrown) {
        /* The queue could not be read. Reported and retried on the next look,
           because a database blinking is not a reason to stop the service. */
        tracker.noteError(thrown);
        log.error("could not read the review queue", {
          error: thrown instanceof Error ? thrown.message : String(thrown),
        });
      }
    });

    await new Promise((wake) => setTimeout(wake, settings.everyMs));
  }
}
