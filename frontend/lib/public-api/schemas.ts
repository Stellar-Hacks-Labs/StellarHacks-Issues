/**
 * What the public API promises, written once.
 *
 * These are JSON Schema objects rather than a validation library's types, and
 * that is the whole design: the same literals are composed into the OpenAPI
 * document the API serves and are what the contract tests check real responses
 * against. A schema written for validation and a schema written for
 * documentation drift apart quietly, and an API whose document is wrong is
 * worse than one with no document — a consumer can discover an undocumented
 * API, but they cannot discover that the document lied.
 *
 * Hand written rather than generated from a library because the frontend
 * carries no schema dependency, and adding one to publish six read-only routes
 * would be a dependency the whole application then has to live with.
 *
 * `additionalProperties: false` everywhere, deliberately. A consumer reading
 * this document should be able to tell that a field they do not see is a field
 * that is not coming, and the contract test turns an accidentally leaked column
 * into a failure rather than into a new de facto part of the API.
 */

export type JsonSchema = {
  type?: "object" | "array" | "string" | "integer" | "number" | "boolean" | "null" | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: (string | number | null)[];
  format?: string;
  description?: string;
  nullable?: true;
  $ref?: string;
};

const string = (description: string): JsonSchema => ({ type: "string", description });
const integer = (description: string): JsonSchema => ({ type: "integer", description });
const nullableString = (description: string): JsonSchema => ({
  type: ["string", "null"],
  description,
});
const nullableInteger = (description: string): JsonSchema => ({
  type: ["integer", "null"],
  description,
});

/** One event, as a listing shows it. */
export const hackathonSummarySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["contract", "slug", "name", "phase", "phaseName", "visibility"],
  properties: {
    contract: string("The hackathon contract's address. The identity everything else is keyed on."),
    slug: string("The path segment this event is published at."),
    name: string("What the organizer called it."),
    tagline: nullableString("One line, as written on the event page."),
    phase: integer("The contract's own phase number, 0 to 9."),
    phaseName: string("That phase in words, as the contract names it."),
    visibility: integer("0 public, 1 participants, 2 restricted. The gallery setting, not a secrecy claim."),
    logoUrl: nullableString("Absolute URL, when one was uploaded."),
  },
};

/** One event in full, with the frozen rules a reader can check. */
export const hackathonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["contract", "slug", "name", "phase", "phaseName", "visibility", "constitutionHash"],
  properties: {
    ...(hackathonSummarySchema.properties ?? {}),
    description: nullableString("The event's own write up, as markdown source."),
    websiteUrl: nullableString("Absolute URL the organizer published."),
    organizer: nullableString("The address the chain recorded as the organizer."),
    constitutionHash: nullableString("Hex digest of the frozen rules. Rebuild them, hash them, compare."),
    prizeAsset: nullableString("The token contract prizes are denominated and paid in."),
    vault: nullableString("The prize vault bound to this event, when one is."),
    teams: nullableInteger("How many teams the indexer has seen."),
    submissions: nullableInteger("How many entries the indexer has seen."),
  },
};

/** One project, as the public gallery shows it. */
export const projectSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["team", "title"],
  properties: {
    team: integer("The team number the contract assigned."),
    title: string("The project's title."),
    summary: nullableString("One paragraph, as the team wrote it."),
    repositoryUrl: nullableString("Absolute URL, when the team published one."),
    demoVideoUrl: nullableString("Absolute URL, when the team published one."),
    liveUrl: nullableString("Absolute URL, when the team published one."),
    track: nullableString("The track the entry was submitted to."),
    submissionDigest: nullableString("Hex digest the contract pinned at the deadline."),
    submittedAtLedger: nullableInteger("The ledger the submission was recorded in."),
    disqualified: { type: "boolean", description: "Whether the entry was disqualified. The reason is on the event's own page." },
  },
};

/** One placing in one track, with the payment that settled it when there is one. */
export const placementSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["rank", "team"],
  properties: {
    rank: integer("1 is first. The contract refuses a table containing rank zero."),
    team: integer("The team placed here."),
    finalScore: nullableInteger("The combined score at the contract's own scale."),
    judgeAverage: nullableInteger("The judges' half, at the same scale."),
    community: nullableInteger("The community half, at the same scale."),
    decidedBy: nullableInteger("Which tie break step decided this placing, 0 to 4."),
    paidAmount: nullableString("What the vault paid for this placing, in the asset's smallest unit."),
    paidTxHash: nullableString("The transaction that paid it, hex."),
  },
};

export const trackResultSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["track", "revealed", "placements"],
  properties: {
    track: string("The track these placings belong to."),
    revealed: {
      type: "boolean",
      description: "False until the event reaches its reveal. No score is served while it is false.",
    },
    placements: { type: "array", items: placementSchema, description: "Ordered by rank." },
  },
};

/** What a reader needs to check the event without trusting this API. */
export const proofSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["contract", "phase", "revealed"],
  properties: {
    contract: string("The hackathon contract's address."),
    phase: integer("The contract's own phase number."),
    revealed: { type: "boolean", description: "Whether the reveal has happened." },
    constitutionHash: nullableString("Hex digest of the frozen rules."),
    scoreRoot: nullableString("Hex root committing to every sealed scorecard."),
    ballotRoot: nullableString("Hex root committing to every sealed ballot."),
    vault: nullableString("The prize vault bound at creation."),
    prizeAsset: nullableString("The token prizes are paid in."),
    payments: {
      type: "array",
      description: "Every payment out of the vault the indexer has seen.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["track", "rank", "recipient", "amount", "kind", "ledger", "txHash"],
        properties: {
          track: string("The track paid."),
          rank: integer("The placing paid."),
          recipient: string("The address paid."),
          amount: string("The amount, in the asset's smallest unit."),
          kind: {
            type: "integer",
            enum: [0, 1, 2],
            description: "0 paid to a winner, 1 swept after the claim period, 2 returned by a no award.",
          },
          ledger: integer("The ledger the payment was recorded in."),
          txHash: string("The transaction, hex."),
        },
      },
    },
  },
};

/** Every list answer, so a consumer writes one paging loop rather than five. */
export function pageSchema(items: JsonSchema, what: string): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["items", "nextCursor"],
    properties: {
      items: { type: "array", items, description: what },
      nextCursor: nullableString("Pass as `cursor` for the next page. Null on the last page."),
    },
  };
}

/** Every failure, in one shape, so a consumer writes one error branch. */
export const errorSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error"],
  properties: {
    error: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message"],
      properties: {
        code: string("A stable machine readable code. Codes are added, never repurposed."),
        message: string("What went wrong, in words, for a person reading a log."),
        detail: nullableString("Which field or value the code is about, when there is one."),
      },
    },
  },
};

/**
 * Whether a value matches a schema, as a list of what is wrong.
 *
 * A list rather than a boolean because its only caller is a test that has to
 * say *where* a response broke the contract. The supported subset is exactly
 * what the schemas above use: a validator that quietly accepts a keyword it
 * does not implement would make the contract tests pass by not looking.
 */
export function validate(schema: JsonSchema, value: unknown, at = "$"): string[] {
  if (schema.$ref !== undefined) {
    return [`${at}: a $ref reached the validator, which resolves none`];
  }

  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];

  if (types.length > 0 && !types.some((type) => matchesType(type, value))) {
    return [`${at}: expected ${types.join(" or ")}, got ${describe(value)}`];
  }

  if (schema.enum !== undefined && !schema.enum.includes(value as string | number | null)) {
    /* The value rather than its type: an enum problem is about which value
       arrived, and "number is not one of 0, 1, 2" tells a reader nothing they
       did not already know. */
    return [`${at}: ${JSON.stringify(value)} is not one of ${schema.enum.join(", ")}`];
  }

  if (types.includes("object") && value !== null && typeof value === "object" && !Array.isArray(value)) {
    return objectProblems(schema, value as Record<string, unknown>, at);
  }

  if (types.includes("array") && Array.isArray(value)) {
    return schema.items === undefined
      ? []
      : value.flatMap((entry, index) => validate(schema.items as JsonSchema, entry, `${at}[${index}]`));
  }

  return [];
}

function objectProblems(schema: JsonSchema, value: Record<string, unknown>, at: string): string[] {
  const problems: string[] = [];

  for (const key of schema.required ?? []) {
    if (!(key in value)) {
      problems.push(`${at}.${key}: required and missing`);
    }
  }

  for (const [key, entry] of Object.entries(value)) {
    const property = schema.properties?.[key];

    if (property === undefined) {
      if (schema.additionalProperties === false) {
        problems.push(`${at}.${key}: not in the schema, and the schema admits nothing else`);
      }
      continue;
    }

    problems.push(...validate(property, entry, `${at}.${key}`));
  }

  return problems;
}

function matchesType(type: string, value: unknown): boolean {
  switch (type) {
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return false;
  }
}

function describe(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}
