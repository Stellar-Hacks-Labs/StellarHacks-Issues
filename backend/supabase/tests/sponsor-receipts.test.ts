import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { backend, remove, signUp, someAddress, someContract, visitor, type TestUser } from "./roles.js";

/**
 * What the sponsor payout view may be read by, and what it must not add.
 *
 * The view exists for convenience and the risk in a convenience over row level
 * secured tables is that it quietly becomes a second way in. Two things are
 * proved here: a signed out visitor reads exactly the rows the underlying
 * policies already allow them, and nobody can write through it.
 *
 * The third is about honesty rather than access. The view carries no sponsor
 * share of a payout, because no record separates one contribution back out of a
 * position's prize, and a column that implied otherwise would be the one
 * dishonest number this feature could print.
 */

let reader: TestUser;
const contract = someContract();
const recipient = someAddress();
const hash = `\\x${"ab".repeat(32)}`;

async function seed(insert: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await insert;

  if (error !== null) {
    throw new Error(`could not set the fixture up: ${error.message}`);
  }
}

beforeAll(async () => {
  reader = await signUp();

  const admin = backend();

  await seed(
    admin.from("hackathons").insert({
      contract_id: contract,
      slug: `event-${contract.slice(1, 9).toLowerCase()}`,
      name: "A sponsored hackathon",
    }),
  );
  await seed(
    admin.from("hackathon_state").insert({
      contract_id: contract,
      organizer: someAddress(),
      constitution_hash: "\\x00",
      phase: 7,
      visibility: 0,
      observed_at_ledger: 1,
    }),
  );
  await seed(
    admin.from("payments").insert([
      { contract_id: contract, track: "ai", rank: 1, recipient, amount: "3000", kind: 0, ledger: 5100, tx_hash: hash },
      { contract_id: contract, track: "ai", rank: 2, recipient, amount: "500", kind: 1, ledger: 5200, tx_hash: hash },
    ]),
  );
});

afterAll(async () => {
  const admin = backend();

  await admin.from("payments").delete().eq("contract_id", contract);
  await admin.from("hackathon_state").delete().eq("contract_id", contract);
  await admin.from("hackathons").delete().eq("contract_id", contract);
  await remove(reader);
});

describe("the sponsor payout view", () => {
  it("is readable by a signed out visitor, like the payments it is built on", async () => {
    const { data, error } = await visitor()
      .from("sponsor_payouts")
      .select("track, rank, amount, kind, ledger, hackathon_name")
      .eq("contract_id", contract)
      .order("rank");

    expect(error).toBeNull();
    expect(data).toEqual([
      expect.objectContaining({ track: "ai", rank: 1, kind: 0, hackathon_name: "A sponsored hackathon" }),
      expect.objectContaining({ track: "ai", rank: 2, kind: 1 }),
    ]);
  });

  it("carries the transaction hash a receipt cites", async () => {
    const { data } = await visitor()
      .from("sponsor_payouts")
      .select("tx_hash")
      .eq("contract_id", contract)
      .eq("rank", 1)
      .single();

    expect(String(data?.tx_hash)).toBe(hash);
  });

  it("keeps the three endings apart rather than labelling them", async () => {
    const { data } = await visitor()
      .from("sponsor_payouts")
      .select("kind")
      .eq("contract_id", contract);

    // The raw enumeration travels: a view that turned 1 into "swept" would be a
    // second vocabulary for the contract's own, and the two would drift.
    expect((data ?? []).map((row) => row.kind).sort()).toEqual([0, 1]);
  });

  it("adds no sponsor share, because no record supports one", async () => {
    const { data } = await visitor().from("sponsor_payouts").select("*").limit(1).single();
    const columns = Object.keys(data ?? {});

    expect(columns).toEqual(
      expect.arrayContaining(["contract_id", "track", "rank", "recipient", "amount", "kind", "ledger", "tx_hash"]),
    );
    for (const absent of ["sponsor", "sponsor_share", "share", "contribution"]) {
      expect(columns).not.toContain(absent);
    }
  });

  it("cannot be written through, by a visitor or by somebody signed in", async () => {
    const row = {
      contract_id: contract,
      track: "ai",
      rank: 3,
      recipient,
      amount: "1",
      kind: 0,
      ledger: 5300,
      tx_hash: hash,
    };

    expect((await visitor().from("sponsor_payouts").insert(row)).error).not.toBeNull();
    expect((await reader.client.from("sponsor_payouts").insert(row)).error).not.toBeNull();

    const { data: still } = await backend()
      .from("payments")
      .select("rank")
      .eq("contract_id", contract);

    expect((still ?? []).map((one) => one.rank).sort()).toEqual([1, 2]);
  });

  it("is read as the person asking, so it cannot outreach the policies", async () => {
    /* `security_invoker` is what makes the two reads below equal. Without it the
       view would answer with its owner's reach and would be the one way to read
       payments that row level security does not govern. */
    const throughView = await visitor().from("sponsor_payouts").select("rank").eq("contract_id", contract);
    const direct = await visitor().from("payments").select("rank").eq("contract_id", contract);

    expect((throughView.data ?? []).length).toBe((direct.data ?? []).length);
  });
});
