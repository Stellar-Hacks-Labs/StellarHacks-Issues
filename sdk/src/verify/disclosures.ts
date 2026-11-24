import type { Scorecard, VoteChoice } from "hackathon-core";

/**
 * Public disclosures of sealed scorecards and ballots.
 *
 * After the reveal, the leaves that built the sealed roots are public. The
 * verifier rebuilds those roots from this set alone; anything left out or
 * invented shows up as a root mismatch.
 */

export interface DisclosedBallot {
  voter: string;
  choices: VoteChoice[];
}

export interface Disclosures {
  scorecards: Scorecard[];
  ballots: DisclosedBallot[];
}

/**
 * Normalise a JSON (or fixture) disclosure payload into typed leaves.
 *
 * Rejects empty collections only when the caller asked for a sealed root check:
 * an event with no community vote still has a scorecard disclosure, and the
 * modules that need one or the other decide for themselves.
 */
export function parseDisclosures(raw: unknown): Disclosures {
  if (raw === null || typeof raw !== "object") {
    throw new Error("disclosures must be an object");
  }

  const body = raw as Record<string, unknown>;
  const scorecards = Array.isArray(body["scorecards"])
    ? body["scorecards"].map(readScorecard)
    : [];
  const ballots = Array.isArray(body["ballots"]) ? body["ballots"].map(readBallot) : [];

  return { scorecards, ballots };
}

/**
 * Pull disclosures out of a decoded event stream.
 *
 * Reveal transactions publish the full scorecard or ballot in their arguments;
 * when those land in the event fixture as `ScoreDisclosed` / `BallotDisclosed`
 * records, this is how the offline verifier finds them without a sealer API.
 */
export function disclosuresFromEvents(
  events: readonly { name: string; fields: Record<string, unknown> }[],
): Disclosures {
  const scorecards: Scorecard[] = [];
  const ballots: DisclosedBallot[] = [];

  for (const event of events) {
    if (event.name === "ScoreDisclosed" || event.name === "ScoreRevealed") {
      const scorecard = event.fields["scorecard"];
      if (scorecard !== undefined) {
        scorecards.push(readScorecard(scorecard));
      }
    }

    if (event.name === "BallotDisclosed" || event.name === "BallotCounted") {
      const voter = event.fields["voter"];
      const choices = event.fields["choices"];
      if (typeof voter === "string" && choices !== undefined) {
        ballots.push({ voter, choices: readChoices(choices) });
      }
    }
  }

  return { scorecards, ballots };
}

function readScorecard(raw: unknown): Scorecard {
  if (raw === null || typeof raw !== "object") {
    throw new Error("scorecard must be an object");
  }

  const body = raw as Record<string, unknown>;
  if (typeof body["judge"] !== "string" || typeof body["team"] !== "number") {
    throw new Error("scorecard needs judge and team");
  }

  if (!Array.isArray(body["scores"])) {
    throw new Error("scorecard needs scores");
  }

  return {
    judge: body["judge"],
    team: body["team"],
    scores: body["scores"].map((entry) => {
      if (entry === null || typeof entry !== "object") {
        throw new Error("criterion score must be an object");
      }
      const row = entry as Record<string, unknown>;
      if (typeof row["criterion"] !== "string" || typeof row["score"] !== "number") {
        throw new Error("criterion score needs criterion and score");
      }

      return { criterion: row["criterion"], score: row["score"] };
    }),
  };
}

function readBallot(raw: unknown): DisclosedBallot {
  if (raw === null || typeof raw !== "object") {
    throw new Error("ballot must be an object");
  }

  const body = raw as Record<string, unknown>;
  if (typeof body["voter"] !== "string") {
    throw new Error("ballot needs a voter");
  }

  return { voter: body["voter"], choices: readChoices(body["choices"]) };
}

function readChoices(raw: unknown): VoteChoice[] {
  if (!Array.isArray(raw)) {
    throw new Error("ballot choices must be an array");
  }

  return raw.map((entry) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error("vote choice must be an object");
    }
    const row = entry as Record<string, unknown>;
    if (typeof row["team"] !== "number" || typeof row["weight"] !== "number") {
      throw new Error("vote choice needs team and weight");
    }

    return { team: row["team"], weight: row["weight"] };
  });
}
