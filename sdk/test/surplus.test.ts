import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { labelSurplus, surplusDestination, type SurplusRoute } from "../src/surplus.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");

describe("surplus routes", () => {
  it("matches the committed route shapes", () => {
    const routes = JSON.parse(
      readFileSync(join(fixtures, "surplus-routes.json"), "utf8"),
    ) as Record<string, SurplusRoute>;

    expect(labelSurplus(routes.pro_rata)).toMatch(/pro rata/i);
    expect(surplusDestination(routes.pro_rata)).toBeNull();

    expect(surplusDestination(routes.return_to)).toMatch(/^G/);
    expect(labelSurplus(routes.return_to)).toMatch(/return/i);

    expect(surplusDestination(routes.roll_forward)).toMatch(/^G/);
    expect(labelSurplus(routes.roll_forward)).toMatch(/roll forward/i);
  });
});
