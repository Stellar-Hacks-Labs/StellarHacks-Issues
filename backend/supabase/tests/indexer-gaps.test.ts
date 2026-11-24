import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { backend, remove, signUp, someContract, visitor, type TestUser } from "./roles.js";

/**
 * Gap and consistency tables are unreachable by anon and authenticated roles.
 *
 * The refusal is `42501` from the missing grant, the same shape the sealed
 * tables use. A policy that hid every row would also pass an empty select; the
 * grant refusal is what stops a future policy from accidentally exposing them.
 */

const admin = backend();

let user: TestUser;
let contract: string;

beforeAll(async () => {
  user = await signUp();
  contract = someContract();

  await admin.from("indexer_gaps").upsert({
    contract_id: contract,
    from_ledger: 100,
    to_ledger: 110,
    reason: "missing_coverage",
  });

  await admin.from("indexer_consistency_checks").insert({
    contract_id: contract,
    ok: false,
    mismatches: [{ table: "hackathon_state", key: "state", field: "phase", projected: 1, onChain: 2 }],
  });
});

afterAll(async () => {
  await admin.from("indexer_gaps").delete().eq("contract_id", contract);
  await admin.from("indexer_consistency_checks").delete().eq("contract_id", contract);
  await remove(user);
});

describe("indexer_gaps", () => {
  it("refuses a signed out visitor", async () => {
    const { error } = await visitor().from("indexer_gaps").select("*").limit(1);

    expect(error?.code).toBe("42501");
  });

  it("refuses a signed in user", async () => {
    const { error } = await user.client.from("indexer_gaps").select("*").limit(1);

    expect(error?.code).toBe("42501");
  });

  it("lets the service role read the row it wrote", async () => {
    const { data, error } = await admin
      .from("indexer_gaps")
      .select("from_ledger, to_ledger, reason")
      .eq("contract_id", contract);

    expect(error).toBeNull();
    expect(data).toEqual([
      { from_ledger: 100, to_ledger: 110, reason: "missing_coverage" },
    ]);
  });
});

describe("indexer_consistency_checks", () => {
  it("refuses a signed out visitor", async () => {
    const { error } = await visitor().from("indexer_consistency_checks").select("*").limit(1);

    expect(error?.code).toBe("42501");
  });

  it("refuses a signed in user", async () => {
    const { error } = await user.client.from("indexer_consistency_checks").select("*").limit(1);

    expect(error?.code).toBe("42501");
  });

  it("lets the service role read the check it wrote", async () => {
    const { data, error } = await admin
      .from("indexer_consistency_checks")
      .select("ok, mismatches")
      .eq("contract_id", contract);

    expect(error).toBeNull();
    expect(data?.[0]?.ok).toBe(false);
    expect(data?.[0]?.mismatches).toHaveLength(1);
  });
});
