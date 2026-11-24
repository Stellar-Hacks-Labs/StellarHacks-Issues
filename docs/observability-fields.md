# Observability fields

## Log line

Every structured log line is one JSON object.

| Field | Required | Meaning |
|:--|:--|:--|
| `ts` | yes | ISO-8601 timestamp when the line was written |
| `level` | yes | `debug`, `info`, `warn` or `error` |
| `service` | yes | `indexer`, `sealer`, `clock` or `reviewer` |
| `msg` | yes | Short human-readable summary |
| `correlationId` | when bound | Hex id for the current request or tick |
| additional keys | no | Event-specific fields; sensitive key names are replaced with `[redacted]` |

### Levels

| Level | Use |
|:--|:--|
| `debug` | Detail that is usually noise in production |
| `info` | Ordinary progress: ingest counts, accepted scorecards, submitted transitions |
| `warn` | Expected refusal that still needs an operator eye (rejected intake) |
| `error` | Unexpected failure: RPC outage, stranded cursor, exhausted retry budget |

## Health report

Documented in `docs/observability.md`. Field names are stable across services.

## Counters

Documented in `docs/metrics.md`.
