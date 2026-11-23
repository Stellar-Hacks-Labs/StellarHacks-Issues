# Backend Metrics Catalog

| Metric Name | Type | Description |
|---|---|---|
| `events_ingested` | Counter | Total Soroban on-chain contract events processed by the indexer. |
| `transitions_submitted` | Counter | Total state machine transitions successfully submitted by the clock service. |
| `scorecards_accepted` | Counter | Total judge scorecards validated and accepted by the sealer. |
| `scorecards_rejected` | Counter | Total judge scorecards rejected due to invalid signature or rule violation. |
| `reviews_completed` | Counter | Total automated AI rubric evaluations completed by the reviewer. |
