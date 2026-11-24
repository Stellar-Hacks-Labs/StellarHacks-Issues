import { describe, expect, it } from "vitest";

import {
  errorSchema,
  hackathonSchema,
  hackathonSummarySchema,
  pageSchema,
  projectSchema,
  proofSchema,
  trackResultSchema,
  validate,
} from "./schemas";

/**
 * The validator the contract tests lean on.
 *
 * Every acceptance claim about this API is "the response matches the published
 * schema", so a validator that quietly accepted what it does not understand
 * would make all of those claims hollow. These are its edges.
 */

const hackathon = {
  contract: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
  slug: "an-event",
  name: "An event",
  tagline: null,
  phase: 4,
  phaseName: "Judging",
  visibility: 0,
  logoUrl: null,
};

describe("the validator", () => {
  it("accepts a payload that matches", () => {
    expect(validate(hackathonSummarySchema, hackathon)).toEqual([]);
  });

  it("names a missing required field and where it was missing from", () => {
    const { name, ...without } = hackathon;

    void name;
    expect(validate(hackathonSummarySchema, without)).toEqual(["$.name: required and missing"]);
  });

  it("refuses a field the schema does not declare", () => {
    expect(validate(hackathonSummarySchema, { ...hackathon, secret: "x" })).toEqual([
      "$.secret: not in the schema, and the schema admits nothing else",
    ]);
  });

  it("distinguishes a nullable field from a field of the wrong type", () => {
    expect(validate(hackathonSummarySchema, { ...hackathon, tagline: null })).toEqual([]);
    expect(validate(hackathonSummarySchema, { ...hackathon, tagline: 7 })).toEqual([
      "$.tagline: expected string or null, got number",
    ]);
    expect(validate(hackathonSummarySchema, { ...hackathon, phase: null })).toEqual([
      "$.phase: expected integer, got null",
    ]);
  });

  it("holds an integer to being whole", () => {
    expect(validate(hackathonSummarySchema, { ...hackathon, phase: 4.5 })).toEqual([
      "$.phase: expected integer, got number",
    ]);
  });

  it("checks every item of an array and says which one broke", () => {
    const page = pageSchema(projectSchema, "projects");
    const problems = validate(page, {
      items: [
        { team: 1, title: "fine" },
        { team: "two", title: "broken" },
      ],
      nextCursor: null,
    });

    expect(problems).toEqual(["$.items[1].team: expected integer, got string"]);
  });

  it("enforces an enum, which is how the three payment endings stay apart", () => {
    const proof = {
      contract: "C",
      phase: 7,
      revealed: true,
      payments: [
        {
          track: "ai",
          rank: 1,
          recipient: "G",
          amount: "1",
          kind: 3,
          ledger: 1,
          txHash: "ab",
        },
      ],
    };

    expect(validate(proofSchema, proof)).toEqual(["$.payments[0].kind: 3 is not one of 0, 1, 2"]);
  });

  it("refuses a $ref rather than silently passing it", () => {
    // The document uses refs; the validator takes resolved schemas only, and
    // saying so beats accepting anything that happens to arrive.
    expect(validate({ $ref: "#/components/schemas/Hackathon" }, hackathon)).toEqual([
      "$: a $ref reached the validator, which resolves none",
    ]);
  });
});

describe("the published shapes", () => {
  it("admit nothing they do not declare", () => {
    for (const [name, schema] of [
      ["HackathonSummary", hackathonSummarySchema],
      ["Hackathon", hackathonSchema],
      ["Project", projectSchema],
      ["TrackResult", trackResultSchema],
      ["Proof", proofSchema],
      ["Error", errorSchema],
    ] as const) {
      expect(schema.additionalProperties, name).toBe(false);
    }
  });

  it("describe every field, because a document with an undescribed field is half a document", () => {
    const undescribed = Object.entries(hackathonSchema.properties ?? {})
      .filter(([, property]) => property.description === undefined)
      .map(([name]) => name);

    expect(undescribed).toEqual([]);
  });
});
