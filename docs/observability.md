# Observability

The four long lived backend services — indexer, sealer, clock and reviewer —
share one logging format, one health shape and a small set of counters. The
implementation lives in `backend/shared/` and each service imports it rather
than inventing a dialect of its own.

## Logging

Every log line is a single JSON object on stdout or stderr. The common fields
are listed in `docs/observability-fields.md`. Secrets, seeds and service role
keys are redacted before the line is written; see the redaction tests under
`backend/shared/test/`.

Each request (sealer) or tick (indexer, clock, reviewer) binds a correlation
identifier so every line from that unit of work can be gathered with one grep.

## Health

Every service reports the same shape:

| Field | Meaning |
|:--|:--|
| `service` | `indexer`, `sealer`, `clock` or `reviewer` |
| `ok` | True when the last tick succeeded and at least one success has been recorded |
| `lastSuccessfulTick` | ISO timestamp of that success, or null |
| `lag` | How far behind the service is (ledgers for the indexer; milliseconds for the others) |
| `lastError` | Most recent failure message, or null |
| `checkedAt` | When the report was produced |

The sealer also answers `GET /health` with that shape plus a metrics snapshot.
The other services expose the same report from their `health` module for
operators and tests.

## Metrics

Counters and what they mean are documented in `docs/metrics.md`.
