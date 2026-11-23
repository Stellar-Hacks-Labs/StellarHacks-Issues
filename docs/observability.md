# Backend Observability Architecture

This document describes the unified structured logging, health reporting, and metric instrumentation across the StellarHacks backend services:
- **Indexer**: Ingests Soroban events into PostgreSQL.
- **Sealer**: Verifies and seals scorecards.
- **Clock**: Advances hackathon lifecycle transitions and payouts.
- **Reviewer**: Performs automated rubric evaluations.

## Shared Package (`@stelhacks/backend-shared`)

All services consume the shared library under `backend/shared/`:
- `log.ts`: Structured JSON logging with level, timestamp, service identifier, and correlation tracking.
- `redact.ts`: Redacts Stellar secret seeds (`S...`), JWTs, database URLs with credentials, and API keys.
- `correlation.ts`: Propagates correlation IDs across ticks and requests.
- `health.ts`: Exposes a standard `ServiceHealthReport` shape.
- `metrics.ts`: Provides atomic event and error counters.
