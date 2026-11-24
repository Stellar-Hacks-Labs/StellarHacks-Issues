# Verifier checks

Each check the CLI prints has a stable name. This page says what a pass proves
and what a fail means.

## `constitution.hash`

**Proves.** The constitution object being hashed is byte-identical to the one
whose digest was locked on chain.

**Fail means.** The rules being served are not the rules that were locked, or
the hash being compared was taken from the wrong instance.

## `roots.score` / `roots.ballot`

**Proves.** Rebuilding a Merkle tree over the disclosed scorecard (or ballot)
leaves with the SDK's domain-separated hashing yields the digest the contract
stored at seal time.

**Fail means.** A leaf was dropped, invented, or ordered differently than the
seal, or the published root was replaced.

## `ballots.weight.<team>` / `ballots.topVotes`

**Proves.** Summing disclosed ballot weights per team matches the weights the
contract reports through `vote_weight` / `top_vote_weight`.

**Fail means.** The community share of the ranking was computed from a different
electorate than the disclosed ballots.

## `ranking.<track>`

**Proves.** `rankTrack` over the locked constitution and the public project data
produces the same order, scores and tie-break labels the contract published for
that track.

**Fail means.** The published ranking is not the ranking those inputs produce.
This is the check the verifier exists for.

## `payouts.<track>:<rank>.amount` / `.shares` / `.team`

**Proves.** The position's payable amount equals the frozen prize tier plus any
recorded bonus, the winning team is the one the ranking named, and member shares
follow the even split with remainder to the earliest members.

**Fail means.** The page or the settlement path is paying a different number
than the locked table and ranking imply.

## `tlock.round`

**Proves.** The Drand quicknet round claimed for sealed inputs is the first
round at or after the judging deadline, using the public quicknet genesis and
period — no sealer API and no Drand HTTP call.

**Fail means.** The claimed reveal round does not follow from the locked
deadline, so early readability cannot be ruled out from public data alone.
