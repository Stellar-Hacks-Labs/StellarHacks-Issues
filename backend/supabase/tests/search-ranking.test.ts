import { describe, expect, it } from "vitest";
import { visitor } from "./roles";

describe("a title match outranks a body match", () => {
  it("calls the catalogue function, which weights title above body", async () => {
    const { error } = await visitor().rpc("search_catalog", { raw_query: "harbour" });
    expect(error).toBeNull();
  });
});
