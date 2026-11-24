/**
 * Strict-mode scoring: the judge commits on chain and discloses after the window.
 *
 * Easy mode hands a signed card to the collection service. Strict mode has no
 * service: the judge posts a digest during judging and opens it once the
 * deadline has passed. The salt blinds the marks until then.
 */

import { toHex } from "./hex";
import { arg, send, type Sent } from "./send";

export interface CriterionScore {
  criterion: string;
  score: number;
}

export interface Scorecard {
  judge: string;
  team: number;
  scores: CriterionScore[];
}

/** Sixteen random bytes, matching the contract's salt length. */
export function randomSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * The digest a judge posts, computed the way the contract computes it.
 *
 * Domain, then the scorecard's XDR as the disclose call will carry it, then
 * the salt. Hashing in any other order produces a digest the disclose refuses.
 */
export async function commitmentOf(
  scorecard: Scorecard,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const [{ hash }, { Spec }] = await Promise.all([
    import("@stellar/stellar-sdk/base"),
    import("@stellar/stellar-sdk/contract"),
  ]);

  const entries = (await import("./contract-spec.json")).default as string[];
  const spec = new Spec(entries);

  const [encoded] = spec.funcArgsToScVals("disclose_scorecard", {
    scorecard,
    salt: Buffer.from(salt),
  });
  const domain = new TextEncoder().encode("stelhacks.v1.scorecard-commitment");

  return new Uint8Array(
    hash(
      Buffer.concat([
        Buffer.from(domain),
        Buffer.from(encoded!.toXDR()),
        Buffer.from(salt),
      ]),
    ),
  );
}

export function saltHex(salt: Uint8Array): string {
  return toHex(salt);
}

export function commitmentHex(commitment: Uint8Array): string {
  return toHex(commitment);
}

/** Post one commitment during the judging window. */
export async function commitScorecard(
  contract: string,
  scorecard: Scorecard,
  commitment: Uint8Array,
): Promise<Sent> {
  return send(
    contract,
    "commit_scorecard",
    [
      await arg.address(scorecard.judge),
      await arg.u32(scorecard.team),
      await arg.bytes32(commitment),
    ],
    scorecard.judge,
  );
}

/** Open one commitment after the judging window. */
export async function discloseScorecard(
  contract: string,
  scorecard: Scorecard,
  salt: Uint8Array,
): Promise<Sent> {
  const [{ Spec }] = await Promise.all([import("@stellar/stellar-sdk/contract")]);
  const entries = (await import("./contract-spec.json")).default as string[];
  const spec = new Spec(entries);
  const values = spec.funcArgsToScVals("disclose_scorecard", {
    scorecard,
    salt: Buffer.from(salt),
  });

  return send(
    contract,
    "disclose_scorecard",
    values.map((value) => ({ value })),
    scorecard.judge,
  );
}
