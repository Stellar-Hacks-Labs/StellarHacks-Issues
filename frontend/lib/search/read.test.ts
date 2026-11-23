import { describe, expect, it } from "vitest";
import { SAMPLE_DOCUMENTS } from "./fixtures";
import { anonymousReader, visibleTo, type Reader } from "./read";

const byId = Object.fromEntries(SAMPLE_DOCUMENTS.map((document) => [document.id, document]));

describe("visibility follows the three levels in decisions.md", () => {
  const stranger = anonymousReader();
  const participant: Reader = { id: "reader", staff: false, registeredHackathons: ["hack-open"] };
  const owner: Reader = { id: "builder-3", staff: false, registeredHackathons: [] };
  const staff: Reader = { id: "staff", staff: true, registeredHackathons: [] };

  it("hides restricted and private projects from a reader who is neither registered nor the owner", () => {
    expect(visibleTo(byId["proj-public"], stranger)).toBe(true);
    expect(visibleTo(byId["proj-restricted"], stranger)).toBe(false);
    expect(visibleTo(byId["proj-private"], stranger)).toBe(false);
  });

  it("lets a registered participant read the restricted gallery and still not the private draft", () => {
    expect(visibleTo(byId["proj-restricted"], participant)).toBe(true);
    expect(visibleTo(byId["proj-private"], participant)).toBe(false);
  });

  it("lets the owner and staff read a private draft", () => {
    expect(visibleTo(byId["proj-private"], owner)).toBe(true);
    expect(visibleTo(byId["proj-private"], staff)).toBe(true);
  });
});
