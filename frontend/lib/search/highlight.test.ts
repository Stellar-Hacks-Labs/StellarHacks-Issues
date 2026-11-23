import { describe, expect, it } from "vitest";
import { highlight } from "./highlight";

describe("highlights are escaped text", () => {
  it("never leaves a raw tag from the title in the markup", () => {
    const html = highlight("Private draft <script>alert(1)</script>", "alert");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<mark>alert</mark>");
  });

  it("escapes an ampersand before it marks anything", () => {
    expect(highlight("A & B", "")).toBe("A &amp; B");
  });
});
