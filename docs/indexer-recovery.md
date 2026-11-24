# Indexer recovery

How to find a missed ledger range and put the durable log back together.

The authority rule is unchanged: projections are disposable, `chain_events` and
`chain_reads` are not. Recovery never invents rows. It re-reads public chain
data into the same upsert path a normal pass uses, so a range that is already
present is a no change.

## Detect gaps

```bash
cd backend/indexer
npx tsx src/index.ts <contract id> --detect-gaps
```

The command compares the cursor with what RPC still serves and with the cover
inferred from stored events. Two reasons appear:

| Reason | Meaning |
|---|---|
| `behind_retention` | The cursor is older than the oldest ledger RPC holds. Those events cannot be fetched from this node. |
| `missing_coverage` | Inside the span the cursor claims, some ledgers were never part of a recorded cover. |

Rows land in `indexer_gaps`, readable only by the service role. Open gaps also
show up on the follow loop's health line.

## Re-ingest a range

```bash
npx tsx src/index.ts <contract id> --reingest <from> <to>
```

The range is inclusive, clamped to the RPC retention window, and paged so one
call cannot ask for an unbounded stretch. Events and reads are upserted; the
cursor is not moved past where a normal follow would leave it. Gaps wholly
inside the range are marked resolved. Projections are rebuilt from the whole
log afterwards.

Run the same range twice and check the row count on `chain_events` for that
contract: it must not grow. That is the idempotency the acceptance criteria
require.

## When RPC cannot help

A `behind_retention` gap means the node has already dropped the ledgers. Filling
it needs an archive or a peer that still holds them, not another `--reingest`
against the same endpoint. Record the gap, keep following from the window's
edge, and restore the missing range from archive when one is available.

## Related

- Decision 22 in `docs/decisions.md` — why the durable log is Postgres, not a
  live contract call.
- `docs/indexer-consistency.md` — proving projections still match the contract
  after the log is repaired.
