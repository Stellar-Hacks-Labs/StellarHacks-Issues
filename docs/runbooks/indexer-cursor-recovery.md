# Indexer cursor recovery

When the indexer cursor is behind retention, or `indexer_gaps` shows open rows
after an outage.

This runbook is the operator path; the detailed mechanics live in
`docs/indexer-recovery.md` and `docs/indexer-consistency.md`.

## Detect

```bash
cd backend/indexer
npx tsx src/index.ts <contract id> --detect-gaps
```

Expected: a printed list of gaps with reason `behind_retention` or
`missing_coverage`, or an empty list when the cover is contiguous.

## Re-ingest a bounded range

```bash
npx tsx src/index.ts <contract id> --reingest <from> <to>
```

Expected: the command pages the range, upserts events and reads, marks gaps
inside the range resolved, and rebuilds projections. Run the same range twice
and confirm `chain_events` row count for that contract does not grow.

## When RPC cannot help

A `behind_retention` gap needs an archive or a peer that still holds the
ledgers. Record the gap, keep following from the window's edge, and restore from
archive when one is available. Do not loop `--reingest` against the same
endpoint expecting a different answer.

## Consistency after repair

```bash
npx tsx src/index.ts <contract id> --compare
```

Expected: no mismatches between projections and live contract state. See
`docs/indexer-consistency.md`.
