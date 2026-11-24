import { describe, expect, it } from "vitest";

import {
  disclosuresFromEvents,
  parseDisclosures,
} from "../../src/verify/disclosures.js";
import { parseEventFixture } from "../../src/verify/events.js";
import { loadReference, readJson, referenceEventsPath } from "./fixtures.js";

describe("disclosures normalise leaves from fixtures and events", () => {
  it("reads scorecards and ballots from the reference state", async () => {
    const loaded = await loadReference();

    expect(loaded.disclosures.scorecards.length).toBe(6);
    expect(loaded.disclosures.ballots.length).toBe(2);
  });

  it("extracts the same leaves from the events fixture", () => {
    const events = parseEventFixture(readJson(referenceEventsPath()));
    const disclosures = disclosuresFromEvents(events);

    expect(disclosures.scorecards[0]?.team).toBe(1);
    expect(disclosures.ballots[0]?.choices[0]?.weight).toBe(7);
  });

  it("rejects a disclosure payload that is not an object", () => {
    expect(() => parseDisclosures(null)).toThrow(/object/);
  });
});
