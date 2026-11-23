# StellarHacks Public Read-Only API (v1)

## Overview

The StellarHacks Public API exposes machine-readable data on hackathons, submitted projects, final results, and cryptographic on-chain proofs for ecosystem dashboards, indexing nodes, and external observers.

The API is strictly read-only, versioned under `/api/v1`, and backed by an OpenAPI 3.1.0 specification.

---

## Base URL

```
https://stellarhacks.org/api/v1
```

For local development:
```
http://localhost:3000/api/v1
```

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/hackathons` | Paginated listing of public hackathons |
| `GET` | `/hackathons/{slug}` | Detail view of a single hackathon |
| `GET` | `/hackathons/{slug}/projects` | Paginated listing of submitted projects |
| `GET` | `/hackathons/{slug}/results` | Hackathon winners and rankings |
| `GET` | `/hackathons/{slug}/proof` | On-chain cryptographic proof and anchor state |
| `GET` | `/openapi.json` | Full OpenAPI 3.1.0 schema document |

---

## Pagination

Listing endpoints support standard pagination parameters:

- `page`: 1-based page number (default: `1`).
- `per_page`: Number of records per page (default: `20`, maximum: `100`).

Example:
```http
GET /api/v1/hackathons?page=2&per_page=10
```

Response format:
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 45,
    "page": 2,
    "perPage": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Privacy & Visibility Guarantees

The public API enforces strict visibility controls:

1. **Unrevealed Scores Redacted**: If an event is active or voting/judging is not officially revealed and settled, numerical scores are redacted to `null` and `scoreRevealed` is set to `false`.
2. **Private Profile Data Excluded**: Personal contact data (email, phone), authentication tokens, internal user IDs, and private signing keys never appear in public project or member responses.

---

## Rate Limiting

To maintain availability, public API requests are rate-limited per client IP address.

- **Limit**: 60 requests per minute.
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed in the current window.
  - `X-RateLimit-Remaining`: Requests remaining in the current window.
  - `X-RateLimit-Reset`: Unix timestamp (seconds) when the window resets.

When the rate limit is exceeded, the server returns HTTP `429 Too Many Requests` with a `Retry-After` header indicating seconds until requests are permitted again:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "status": 429,
  "details": { "retryAfterSeconds": 45 }
}
```

---

## Caching

Responses include standard caching headers:
```http
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
ETag: W/"..."
```
Clients should send conditional `If-None-Match: <etag>` headers; the API responds with `304 Not Modified` when content has not changed.
