/**
 * Commit and disclose one scorecard under the strict judging mode.
 *
 *     STELLAR_SECRET_KEY=S... npx tsx examples/strict-judging.ts C<contract id> <team>
 *
 * The key has to be a judge named in the locked constitution. The script posts
 * a commitment during judging and opens it after the window, printing every
 * event the contract emits along the way so a maintainer can attach the log
 * to a pull request.
 */

import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";

import {
  HackathonCore,
  randomSalt,
  scorecardCommitment,
  toHex,
  type Scorecard,
} from "../src/index.js";

const NETWORK = "Test SDF Network ; September 2015";
const RPC = "https://soroban-testnet.stellar.org";

const [contractId, teamArg] = process.argv.slice(2);
const secret = process.env["STELLAR_SECRET_KEY"];

if (contractId === undefined || teamArg === undefined || secret === undefined) {
  throw new Error(
    "usage: STELLAR_SECRET_KEY=S... strict-judging.ts <contract id> <team>",
  );
}

const team = Number(teamArg);
const keypair = Keypair.fromSecret(secret);
const judge = keypair.publicKey();
const { signTransaction } = basicNodeSigner(keypair, NETWORK);

const client = new HackathonCore({
  contractId,
  networkPassphrase: NETWORK,
  rpcUrl: RPC,
  publicKey: judge,
  signTransaction,
});

const scorecard: Scorecard = {
  judge,
  team,
  scores: [
    { criterion: "technical", score: 82 },
    { criterion: "novelty", score: 64 },
  ],
};

const salt = randomSalt();
const commitment = scorecardCommitment(scorecard, salt);

console.log("judge", judge);
console.log("team", team);
console.log("commitment", toHex(commitment));
console.log("salt", toHex(salt));

const committed = await (
  await client.commit_scorecard({
    judge,
    team,
    commitment: Buffer.from(commitment),
  })
).signAndSend();

console.log("commit tx", committed.sendTransactionResponse?.hash);

const disclosed = await (
  await client.disclose_scorecard({
    scorecard,
    salt: Buffer.from(salt),
  })
).signAndSend();

console.log("disclose tx", disclosed.sendTransactionResponse?.hash);
console.log("events", JSON.stringify(disclosed.getTransactionResponse?.resultMetaXdr, null, 2));
