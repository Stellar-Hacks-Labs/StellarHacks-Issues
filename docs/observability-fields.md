# Observability Fields Reference

Every structured log output emitted by backend services adheres to the following JSON schema:

```json
{
  "timestamp": "2026-11-23T12:00:00.000Z",
  "level": "info",
  "service": "indexer",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processed batch of events",
  "meta": {
    "count": 10,
    "latestLedger": 123456
  }
}
```

## Fields
- `timestamp`: ISO-8601 UTC timestamp.
- `level`: Log severity (`debug`, `info`, `warn`, `error`).
- `service`: Name of the emitting backend service (`indexer`, `sealer`, `clock`, `reviewer`).
- `correlationId`: UUID correlating operations across execution boundaries.
- `message`: Free-form event description (automatically redacted).
- `meta`: Optional context object with sanitized metadata.
