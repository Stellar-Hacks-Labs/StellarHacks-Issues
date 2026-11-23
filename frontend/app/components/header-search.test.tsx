import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HeaderSearch } from "./header-search";

describe("the header search field", () => {
  it("posts the query to the search page and names the shortcut", () => {
    const html = renderToStaticMarkup(<HeaderSearch />);
    expect(html).toContain('action="/search"');
    expect(html).toContain('name="q"');
    expect(html).toContain("Search");
  });
});
