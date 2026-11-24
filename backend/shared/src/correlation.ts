import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";

/**
 * One identifier per request or tick, so log lines belonging to the same unit
 * of work can be gathered without inventing a second protocol.
 *
 * Held in AsyncLocalStorage rather than threaded as an argument so call sites
 * that already have enough parameters do not grow another one, and so a helper
 * deep in a stack still stamps the same id the entry point chose.
 */

const store = new AsyncLocalStorage<string>();

/** A fresh correlation id. Short enough to read; long enough not to collide. */
export function newCorrelationId(): string {
  return randomBytes(8).toString("hex");
}

/** The id for the current async context, if one was bound. */
export function currentCorrelationId(): string | undefined {
  return store.getStore();
}

/** Run `fn` with `id` bound for every await that descends from this call. */
export function withCorrelationId<T>(id: string, fn: () => T): T {
  return store.run(id, fn);
}
