# Metrics

Process-local counters. There is no hosted metrics backend; an operator reads
them from logs, from `GET /health` on the sealer, or from the shared metrics
snapshot in tests.

| Counter | Service | Meaning |
|:--|:--|:--|
| `events_ingested` | indexer | Soroban events written into the durable log in one pass |
| `transitions_submitted` | clock | Phase or settlement calls that were actually signed and sent |
| `scorecards_accepted` | sealer | Scorecard intake that passed every check and received a receipt |
| `scorecards_rejected` | sealer | Scorecard intake that failed a check (shape, phase, seal or signature) |
| `reviews_completed` | reviewer | AI review runs that finished writing every project in the queue item |

Counters only move forward. They reset when the process restarts, which is the
intended trade: a restart is itself an event an operator notices, and a hosted
backend is out of scope for this milestone.
