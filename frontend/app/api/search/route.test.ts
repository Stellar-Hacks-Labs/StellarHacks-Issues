import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { SAMPLE_DOCUMENTS } from "../../../lib/search/fixtures";
import { anonymousReader } from "../../../lib/search/read";

describe("GET /api/search", () => {
  it("omits a private project from a stranger's page and keeps the facet count honest", async () => {
    const response = await GET(new Request("http://localhost/api/search?q=draft", {
      headers: {
        "x-search-corpus": JSON.stringify(SAMPLE_DOCUMENTS),
        "x-search-reader": JSON.stringify(anonymousReader()),
      },
    }));
    const body = await response.json();
    expect(body.hits.map((hit: { id: string }) => hit.id)).not.toContain("proj-private");
    expect(body.total).toBe(0);
  });
});
