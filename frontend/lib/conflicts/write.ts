/**
 * What a judge is saying when they declare a conflict, checked before it is
 * sent anywhere.
 *
 * A declaration is a claim about a relationship, and the product cannot verify
 * it: nobody here knows whether a judge mentored a team. What it can do is make
 * the claim cheap to make, hard to backdate and impossible to quietly withdraw,
 * and refuse the one thing it rules out — a scorecard from that judge for that
 * team.
 *
 * So the checks here are about shape rather than truth. The relationship comes
 * from a list because the queue filter and the proof page both read it; the
 * note is free text because the list will never cover somebody's actual
 * situation.
 */

export const RELATIONSHIPS = ["mentor", "teammate", "employer", "investor", "family", "other"] as const;

export type Relationship = (typeof RELATIONSHIPS)[number];

export function isRelationship(value: string): value is Relationship {
  return (RELATIONSHIPS as readonly string[]).includes(value);
}

/** How each relationship is read out to a person, in the judge's own direction. */
export const RELATIONSHIP_WORDS: Record<Relationship, string> = {
  mentor: "I mentored or advised this team",
  teammate: "I have worked on a team with one of its members",
  employer: "I employ, or am employed by, one of its members",
  investor: "I hold a stake in this project or its company",
  family: "I am related to one of its members",
  other: "Another relationship, described below",
};

export interface Declaration {
  contract: string;
  judge: string;
  team: number;
  relationship: Relationship;
  note: string;
  declaredAt: string;
}

export const NOTE_LIMIT = 500;

/**
 * One declaration, or the reason it is not one yet.
 *
 * Returned as a value rather than thrown, the way the rest of this codebase's
 * drafts are, because every caller is a form that has to put the reason next to
 * the field rather than in a console.
 */
export function draftDeclaration(input: {
  contract: string;
  judge: string;
  team: number;
  relationship: string;
  note: string;
  now: string;
}): Declaration | { error: string } {
  if (!/^C[A-Z2-7]{55}$/.test(input.contract)) {
    return { error: "that is not a hackathon address" };
  }
  if (!/^G[A-Z2-7]{55}$/.test(input.judge)) {
    return { error: "connect the wallet you were named a judge with" };
  }
  if (!Number.isInteger(input.team) || input.team < 1) {
    return { error: "that is not a project" };
  }
  if (!isRelationship(input.relationship)) {
    return { error: "choose how you know this team" };
  }

  const note = input.note.trim();

  if (note.length > NOTE_LIMIT) {
    return { error: `keep the note under ${NOTE_LIMIT} characters` };
  }
  /* The one relationship the list cannot describe is the one that needs the
     note, so it is the one place the note is required. */
  if (input.relationship === "other" && note.length === 0) {
    return { error: "describe the relationship" };
  }
  if (!Number.isFinite(Date.parse(input.now))) {
    return { error: "that is not a time" };
  }

  return {
    contract: input.contract,
    judge: input.judge,
    team: input.team,
    relationship: input.relationship,
    note,
    declaredAt: new Date(input.now).toISOString(),
  };
}

/** The row the table takes, from the declaration a form produced. */
export function rowFor(declaration: Declaration): Record<string, unknown> {
  return {
    contract_id: declaration.contract,
    judge: declaration.judge,
    team_id: declaration.team,
    relationship: declaration.relationship,
    note: declaration.note,
  };
}
