# Indexer consistency

Proving the projected tables still match what the contract answers.

A complete `chain_events` log can still leave projections wrong after an outage
if a rebuild was skipped or interrupted. The consistency check reads selected
live state and compares it with `hackathon_state`, `submissions`, and `results`.

## Run a check

```bash
cd backend/indexer
npx tsx src/index.ts <contract id> --check
```

The command stores an append-only row in `indexer_consistency_checks` (service
role only) and prints either that projections match or a field-level mismatch
list. A non-zero exit status means at least one field disagreed.

Compared fields:

| Source | Fields |
|---|---|
| `state()` / `constitution()` | phase, visibility, prize asset, judges |
| `submission(team)` | uri, track, metadata hash |
| `ranking(track)` | team, scores, and tie-break step per place |

Tracks and team ids come from the projection so the check asks the same
questions the pages already show answers for.

## Reading the result from health

The follow loop's health report carries the newest check: whether it passed,
how many mismatches it found, and when it ran. An unchecked contract reports
`ok: null` rather than pretending agreement.

## After a mismatch

1. Confirm the contract state is still live. Expired Soroban entries make the
   on-chain side unreadable; that is a finding, not a projection bug.
2. Rebuild projections from the log: `npx tsx src/index.ts <contract id> --rebuild`.
3. Run `--check` again. If it still fails, the log itself is wrong — detect gaps
   and re-ingest before another rebuild. See `docs/indexer-recovery.md`.

## Related

- Decision 22 in `docs/decisions.md` — reads captured at ingest time because
  contract state expires.
- `backend/indexer/README.md` — ordinary follow, `--once`, and `--rebuild`.
