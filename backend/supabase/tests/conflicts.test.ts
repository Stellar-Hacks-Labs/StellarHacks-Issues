import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { backend, remove, signUp, someAddress, someContract, visitor, type TestUser } from "./roles.js";

/**
 * Who may write a conflict declaration, and who may read one while the panel is
 * still working.
 *
 * A declaration is a claim a judge makes about themselves, and its value rests
 * entirely on three properties nobody can work around: only that judge can make
 * it, nobody can make it on their behalf, and the time on it is the database's
 * rather than the client's. Each one is a policy here and nothing on chain, so
 * each one is proved here.
 *
 * Reading before the reveal is deliberately narrow. The judge sees their own,
 * because their console shows what they have already said; the organizer sees
 * the event's, because they are the one who reassigns a project that is a card
 * short. Nobody else sees anything until the reveal, which is the subject of
 * `conflicts-reveal.test.ts`.
 */

let judge: TestUser;
let otherJudge: TestUser;
let organizer: TestUser;
let participant: TestUser;
let judgeAddress: string;
let otherJudgeAddress: string;
let organizerAddress: string;
const contract = someContract();

async function seed(insert: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await insert;

  if (error !== null) {
    throw new Error(`could not set the fixture up: ${error.message}`);
  }
}

beforeAll(async () => {
  [judge, otherJudge, organizer, participant] = await Promise.all([
    signUp(),
    signUp(),
    signUp(),
    signUp(),
  ]);

  judgeAddress = someAddress();
  otherJudgeAddress = someAddress();
  organizerAddress = someAddress();

  const admin = backend();

  await seed(
    admin.from("wallet_links").insert([
      { address: judgeAddress, profile_id: judge.id },
      { address: otherJudgeAddress, profile_id: otherJudge.id },
      { address: organizerAddress, profile_id: organizer.id },
    ]),
  );

  await seed(
    admin.from("hackathons").insert({
      contract_id: contract,
      slug: `event-${contract.slice(1, 9).toLowerCase()}`,
      name: "A hackathon with a declared conflict",
    }),
  );

  /* Phase four is judging: the window where declarations are written and where
     everybody but the judge and the organizer is supposed to see nothing. */
  await seed(
    admin.from("hackathon_state").insert({
      contract_id: contract,
      organizer: organizerAddress,
      judges: [judgeAddress, otherJudgeAddress],
      constitution_hash: "\\x00",
      phase: 4,
      visibility: 0,
      observed_at_ledger: 1,
    }),
  );
});

afterAll(async () => {
  const admin = backend();

  await admin.from("conflict_declarations").delete().eq("contract_id", contract);
  await admin.from("hackathon_state").delete().eq("contract_id", contract);
  await admin.from("hackathons").delete().eq("contract_id", contract);
  await admin
    .from("wallet_links")
    .delete()
    .in("address", [judgeAddress, otherJudgeAddress, organizerAddress]);

  await Promise.all([remove(judge), remove(otherJudge), remove(organizer), remove(participant)]);
});

describe("a judge declaring a conflict", () => {
  it("writes their own and reads it back", async () => {
    const { error } = await judge.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 3,
      relationship: "mentor",
      note: "ran their office hours",
    });

    expect(error).toBeNull();

    const { data } = await judge.client
      .from("conflict_declarations")
      .select("team_id, relationship, declared_at")
      .eq("contract_id", contract);

    expect(data).toEqual([
      expect.objectContaining({ team_id: 3, relationship: "mentor" }),
    ]);
    /* The time is the database's default. A client that could set it could
       make a declaration written after the scores look as though it came
       first, which is the only thing this row is evidence of. */
    expect(Number.isFinite(Date.parse(String(data?.[0]?.declared_at)))).toBe(true);
  });

  it("cannot write one in another judge's name", async () => {
    const { error } = await otherJudge.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 4,
      relationship: "teammate",
      note: "",
    });

    expect(error).not.toBeNull();
  });

  it("cannot edit another judge's declaration", async () => {
    const { error, data } = await otherJudge.client
      .from("conflict_declarations")
      .update({ relationship: "other", note: "withdrawn" })
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .select("team_id");

    /* PostgREST answers an update that matched no visible row with success and
       nothing changed, which is the shape row level security produces here.
       Either answer is acceptable; what is not is the row changing. */
    expect(error === null ? (data ?? []) : []).toEqual([]);

    const { data: still } = await backend()
      .from("conflict_declarations")
      .select("relationship, note")
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .eq("team_id", 3);

    expect(still).toEqual([{ relationship: "mentor", note: "ran their office hours" }]);
  });

  it("can correct their own, without moving the time it was made", async () => {
    const { data: before } = await backend()
      .from("conflict_declarations")
      .select("declared_at")
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .eq("team_id", 3)
      .single();

    const { error } = await judge.client
      .from("conflict_declarations")
      .update({ note: "ran their office hours in week one" })
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .eq("team_id", 3);

    expect(error).toBeNull();

    const { data: after } = await backend()
      .from("conflict_declarations")
      .select("note, declared_at")
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .eq("team_id", 3)
      .single();

    expect(after?.note).toBe("ran their office hours in week one");
    expect(after?.declared_at).toBe(before?.declared_at);
  });

  it("cannot hand their declaration to somebody else by editing it", async () => {
    const { error } = await judge.client
      .from("conflict_declarations")
      .update({ judge: otherJudgeAddress })
      .eq("contract_id", contract)
      .eq("judge", judgeAddress)
      .eq("team_id", 3);

    expect(error).not.toBeNull();
  });
});

describe("somebody who is not that judge", () => {
  it("reads nothing of another judge's declarations", async () => {
    const { data } = await otherJudge.client
      .from("conflict_declarations")
      .select("team_id")
      .eq("contract_id", contract);

    expect(data ?? []).toEqual([]);
  });

  it("is read in full by the event's organizer", async () => {
    const { data } = await organizer.client
      .from("conflict_declarations")
      .select("judge, team_id")
      .eq("contract_id", contract);

    expect(data).toEqual([expect.objectContaining({ judge: judgeAddress, team_id: 3 })]);
  });

  it("is read by nobody signed out while the panel is still working", async () => {
    const { data } = await visitor()
      .from("conflict_declarations")
      .select("team_id")
      .eq("contract_id", contract);

    expect(data ?? []).toEqual([]);
  });

  it("is read by nobody who merely signed in", async () => {
    const { data } = await participant.client
      .from("conflict_declarations")
      .select("team_id")
      .eq("contract_id", contract);

    expect(data ?? []).toEqual([]);
  });
});

describe("the shape of a declaration", () => {
  it("refuses a relationship that is not on the list", async () => {
    const { error } = await judge.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 9,
      relationship: "acquaintance",
      note: "",
    });

    expect(error).not.toBeNull();
  });

  it("refuses a project number the contract would not recognise", async () => {
    const { error } = await judge.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: judgeAddress,
      team_id: 0,
      relationship: "mentor",
      note: "",
    });

    expect(error).not.toBeNull();
  });

  it("refuses a declaration from somebody the constitution did not name a judge", async () => {
    const strangerAddress = someAddress();

    await backend().from("wallet_links").insert({ address: strangerAddress, profile_id: participant.id });

    const { error } = await participant.client.from("conflict_declarations").insert({
      contract_id: contract,
      judge: strangerAddress,
      team_id: 5,
      relationship: "mentor",
      note: "",
    });

    expect(error).not.toBeNull();

    await backend().from("wallet_links").delete().eq("address", strangerAddress);
  });
});
