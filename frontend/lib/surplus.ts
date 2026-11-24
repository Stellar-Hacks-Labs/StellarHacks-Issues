import type { SurplusRoute } from "./rules";

/**
 * Reading the declared surplus route for a page that has to show it.
 *
 * The route is frozen with the constitution, so a sponsor panel and a proof
 * page both ask the same question: where does leftover undirected money go
 * once the prize table has been paid. Answering it here keeps the wording in
 * one place.
 */

/** A short label suitable for a line on the proof page or the sponsor panel. */
export function labelOf(route: SurplusRoute): string {
  switch (route.kind) {
    case "pro-rata":
      return "Pro rata across prize positions";
    case "return-to":
      return route.address.length > 0
        ? `Returned to ${shorten(route.address)}`
        : "Returned to a declared address";
    case "roll-forward":
      return route.address.length > 0
        ? `Rolled forward to ${shorten(route.address)}`
        : "Rolled forward to a named next instance";
  }
}

/** One sentence explaining what the route does for a reader who is not sure. */
export function explain(route: SurplusRoute): string {
  switch (route.kind) {
    case "pro-rata":
      return "Undirected deposits beyond the prize table are spread across every position in proportion to what each already pays.";
    case "return-to":
      return "Undirected deposits beyond the prize table are sent to a declared address once every position has been settled.";
    case "roll-forward":
      return "Undirected deposits beyond the prize table are sent into the vault of a named next hackathon instance.";
  }
}

/** Whether the route names an address a reader can follow on an explorer. */
export function addressOf(route: SurplusRoute): string | null {
  if (route.kind === "pro-rata") {
    return null;
  }

  return route.address.length > 0 ? route.address : null;
}

function shorten(address: string): string {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
