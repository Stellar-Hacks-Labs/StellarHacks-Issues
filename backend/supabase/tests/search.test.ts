import { describe, expect, it } from "vitest";
import { backend, visitor } from "./roles";

describe("search_catalog", () => {
  it("answers a public query for a signed-out visitor", async () => {
    const { error } = await visitor().rpc("search_catalog", { raw_query: "payments" });
    expect(error).toBeNull();
  });

  it("lets the service role read the table the function reads", async () => {
    const { error } = await backend().from("search_documents").select("id").limit(1);
    expect(error).toBeNull();
  });
});
