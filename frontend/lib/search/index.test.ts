import { describe, expect, it } from "vitest";
import { SAMPLE_DOCUMENTS } from "./fixtures";
import { searchCatalog } from "./index";
import { anonymousReader } from "./read";

describe("facet counts are the counts of the rows being shown", () => {
  it("does not count a private project a stranger cannot see", () => {
    const page = searchCatalog(SAMPLE_DOCUMENTS, anonymousReader(), { q: "payments" });
    const ids = page.hits.map((hit) => hit.id);
    expect(ids).not.toContain("proj-private");
    expect(ids).not.toContain("proj-restricted");
    const phase = page.facets.find((facet) => facet.name === "phase");
    const open = phase?.options.find((option) => option.value === "open");
    expect(open?.count).toBe(page.hits.filter((hit) => hit.phase === "open").length);
    expect(page.total).toBe(page.hits.length);
  });
});
