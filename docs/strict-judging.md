# Strict judging mode

The sealed (easy) mode is the default: judges sign scorecards off chain, a
named collection service publishes one Merkle root, and anybody opens the
leaves after the deadline. That design rests on the sealer being available and
honest about inclusion. Where that assumption is not acceptable, the
constitution can name `JudgingMode::Strict` instead.

## How it works

1. During the judging window each assigned judge calls `commit_scorecard` with
   a digest of their scorecard and a private salt.
2. After the window closes and the phase advances to reveal, anybody who holds
   the scorecard and the salt calls `disclose_scorecard`.
3. The contract checks the disclosure against the posted commitment, then
   feeds the weighted total into the same tally path `reveal_score` uses.

A mismatched disclosure is refused and leaves state unchanged. A commitment
that is never opened stays on chain, so a withheld disclose is visible rather
than silent.

## Commitment layout

```
H("stelhacks.v1.scorecard-commitment" ‖ scorecard_xdr ‖ salt)
```

The salt is at least sixteen random bytes. Without it an observer who knows
the rubric could brute-force every plausible mark combination before the
window closed.

## Ranking

Strict and sealed mode share the ranking path. On the same marks they produce
the same averages and the same placements. The modes differ only in who holds
the seal until the disclose.

## SDK and console

`@stelhacks/sdk` exposes `scorecardCommitment`, `commitmentMatches` and
`randomSalt`. The judge console switches to the strict panel when the locked
rules name no sealer. The indexer projects `ScorecardCommitted` into
`scorecard_commitments` and stamps a disclose when `ScoreRevealed` arrives for
the same judge and team.
