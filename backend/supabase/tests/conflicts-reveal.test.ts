import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { backend, remove, signUp, someAddress, someContract, visitor, type TestUser } from "./roles.js";

/**
 * When a declaration becomes public, and what decides it.
 *
 * The declarations are the counterpart to the scores: they are what lets a team
 * check that the judge who marked them was not the judge who mentored them. So
 * they open at exactly the moment the scores do and not a phase earlier —
 * before the reveal, a public list of who declared what tells a team which
 * judges are still marking it.
 *
 * What decides it is the phase the indexer recorded, not a flag anybody sets.
 * This test moves a hackathon from judging to the reveal with nothing else
 * changing, and the same visitor who read nothing reads everything.
 */

let judge: TestUser;
let judgeAddress: string;
const contract = someContract();

async function seed(insert: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await insert;

  if (error !== null) {
    throw new Error(`could not set the fixture up: ${error.message}`);
  }
}

beforeAll(async () => {
  judge = await signUp();
  judgeAddress = someAddress();

  const admin = backend();

  await seed(admin.from("wallet_links").insert({ address: judgeAddress, profile_id: judge.id }));
  await seed(
    admin.from("hackathons").insert({
      contract_id: contract,
      slug: `event-${contract.slice(1, 9).toLowerCase()}`,
      name: "A hackathon reaching its reveal",
    }),
  );
  await seed(
    admin.from("hackathon_state").insert({
      contract_id: contract,
      organizer: someAddress(),
      judges: [judgeAddress],
      constitution_hash: "\\x00",
      phase: 4,
      visibility: 0,
      observed_at_ledger: 1,
    }),
  );
  await seed(
    judge.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 2,
      relationship: "family",
      note: "my sister is on this team",
    }),
  );
});

afterAll(async () => {
  const admin = backend();

  await admin.from("conflict_declarations").delete().eq("contract_id", contract);
  await admin.from("hackathon_state").delete().eq("contract_id", contract);
  await admin.from("hackathons").delete().eq("contract_id", contract);
  await admin.from("wallet_links").delete().eq("address", judgeAddress);
  await remove(judge);
});

describe("before the reveal", () => {
  it("a visitor reads no declaration", async () => {
    const { data } = await visitor()
      .from("conflict_declarations")
      .select("judge, team_id")
      .eq("contract_id", contract);

    expect(data ?? []).toEqual([]);
  });
});

describe("from the reveal onwards", () => {
  it("a visitor reads every declaration, with the relationship and the time", async () => {
    await seed(backend().from("hackathon_state").update({ phase: 5 }).eq("contract_id", contract));

    const { data } = await visitor()
      .from("conflict_declarations")
      .select("judge, team_id, relationship, note, declared_at")
      .eq("contract_id", contract);

    expect(data).toEqual([
      expect.objectContaining({
        judge: judgeAddress,
        team_id: 2,
        relationship: "family",
        note: "my sister is on this team",
      }),
    ]);
  });

  it("a visitor still cannot write or remove one", async () => {
    const written = await visitor().from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 7,
      relationship: "mentor",
      note: "",
    });

    expect(written.error).not.toBeNull();

    const removed = await visitor()
      .from("conflict_declarations")
      .delete()
      .eq("contract_id", contract)
      .eq("team_id", 2)
      .select("team_id");

    /* No delete policy exists for any client role, so a declaration cannot be
       taken back once the scores it bound are open. That is the point: a
       record that can be removed after the fact is not a record. */
    expect(removed.error === null ? (removed.data ?? []) : []).toEqual([]);

    const { data: still } = await backend()
      .from("conflict_declarations")
      .select("team_id")
      .eq("contract_id", contract);

    expect(still).toEqual([{ team_id: 2 }]);
  });

  it("stays open through the phases after it", async () => {
    for (const phase of [6, 7, 8]) {
      await seed(backend().from("hackathon_state").update({ phase }).eq("contract_id", contract));

      const { data } = await visitor()
        .from("conflict_declarations")
        .select("team_id")
        .eq("contract_id", contract);

      expect(data).toEqual([{ team_id: 2 }]);
    }
  });
});
