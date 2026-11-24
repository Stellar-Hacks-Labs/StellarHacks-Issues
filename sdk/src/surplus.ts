/**
 * Where undirected deposits beyond the prize table go at closure.
 *
 * Mirrored from the contract's `SurplusRoute` so a client can label a frozen
 * route without importing the bindings for a single enum. The three variants
 * are the whole of what the constitution accepts.
 */

export type SurplusRoute =
  | { tag: "ProRata"; values?: undefined }
  | { tag: "ReturnTo"; values: readonly [string] }
  | { tag: "RollForward"; values: readonly [string] };

/** A short English label for a frozen surplus route. */
export function labelSurplus(route: SurplusRoute): string {
  switch (route.tag) {
    case "ProRata":
      return "Pro rata across prize positions";
    case "ReturnTo":
      return `Return to ${route.values[0]}`;
    case "RollForward":
      return `Roll forward to ${route.values[0]}`;
  }
}

/** The destination address, when the route names one. */
export function surplusDestination(route: SurplusRoute): string | null {
  switch (route.tag) {
    case "ProRata":
      return null;
    case "ReturnTo":
    case "RollForward":
      return route.values[0] ?? null;
  }
}
