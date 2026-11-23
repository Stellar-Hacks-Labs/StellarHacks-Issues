# Public API Versioning & Deprecation Policy

## Versioning Scheme

The StellarHacks Public API uses URI path versioning:

```
/api/v1/...
```

Every endpoint under `/api/v1` is governed by backward compatibility rules described below.

---

## Backward Compatibility Rules

The following changes are considered **backward-compatible** (non-breaking) and may occur within the `v1` lifecycle without changing the major version prefix:

1. Adding new endpoints (e.g. `/api/v1/tracks`).
2. Adding optional query parameters to existing endpoints.
3. Adding new properties to response JSON objects.
4. Adding new allowed values to response enum fields.

The following changes are considered **breaking** and require a new API version (e.g. `/api/v2`):

1. Removing or renaming existing endpoints.
2. Removing or renaming existing response properties.
3. Altering the semantic meaning or type of an existing property.
4. Making previously optional request parameters mandatory.

---

## Deprecation & Sunset Process

1. **Deprecation Notice**: When an endpoint or version is slated for replacement, a minimum **90-day deprecation window** is announced via developer documentation and release notes.
2. **Deprecation Headers**: Deprecated endpoints will return HTTP `Deprecation: true` and `Sunset: <date>` headers per RFC 8594.
3. **Sunset**: Following the deprecation period, the deprecated endpoint or version will be retired and return HTTP `410 Gone`.
