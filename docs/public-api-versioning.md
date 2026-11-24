# Versioning and deprecation

What `/api/v1` promises, and what it does not.

## The promise

While `v1` is served:

- **A field is never removed, renamed, or given a new meaning.** If something has
  to change shape, it arrives as a new field beside the old one.
- **A field's type never narrows.** A nullable field stays nullable; a string
  stays a string. Widening is also a change, so a field that could become
  nullable is declared nullable from the start — that is why so many of them are.
- **An error code is never repurposed.** Codes are added. A consumer branching on
  `not_found` will never find that it came to mean something else.
- **A route is never removed.** It may start answering `503` if a source behind
  it goes away for good, and that would be documented here before it happened.
- **Paging stays cursor based**, and a cursor stays opaque. A cursor issued by a
  later deployment may stop working — it carries a version prefix for exactly
  that reason, and an unusable one is refused with `invalid_cursor` rather than
  silently treated as the first page.

## What is not promised

- **Field order, whitespace, or anything else about the serialization.** Compare
  parsed values, not bytes.
- **The value of a cursor.** It is an implementation detail with a version marker
  on it.
- **That a nullable field is populated.** `teams`, `submissions`,
  `constitutionHash` and the sealed roots are null whenever the source behind
  them has not caught up or cannot be reached, and a consumer that treats null as
  zero will be wrong on a day the indexer is behind.
- **Latency, or the rate limit's exact numbers.** Both may change; the limit is
  always stated in the headers of every answer rather than assumed from
  documentation.
- **Anything about `/api` without a version.** Those routes serve this product's
  pages and change whenever a page does. They are not this API.

## How a version ends

1. **Announcement.** A successor is published at `/api/v2`, this document names
   the date `v1` stops being served, and that date is at least **six months**
   away.
2. **Deprecation.** From the announcement, every `v1` answer carries
   `deprecation` and `sunset` headers ([RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)),
   and the OpenAPI document marks every operation `deprecated: true`. Nothing
   changes about what the answers contain.
3. **Sunset.** On the stated date `v1` answers `410 Gone` with the error shape it
   always used, naming `/api/v2` in the detail. It does not start answering
   `v2`'s shapes under `v1`'s path; a consumer that was not updated gets a clear
   failure rather than a subtly different answer.

A version is only ended for a change that cannot be made additively. "We would
rather it looked like this" is not such a change.

## Changes inside a version

Additive changes ship whenever they are ready and are not announced in advance:

- a new field on an existing shape,
- a new error code for a condition that previously fell under a broader one,
- a new route,
- a new optional query parameter.

Every one of those is a change a correctly written consumer does not notice,
which is the test for whether it belongs in this list. A consumer that breaks
when a field is **added** is a consumer validating responses with a closed
schema of its own — reasonable, and the reason `additionalProperties: false`
appears in this API's own document: it tells you what is there today, not what
will never be there.

## Where the limits live

Nothing in this document is only a sentence here:

| Promise | Enforced in |
|---|---|
| The published shapes | `frontend/lib/public-api/schemas.ts` |
| One status per error code | `frontend/lib/public-api/errors.ts` |
| Paging bounds and cursor opacity | `frontend/lib/public-api/pagination.ts` |
| Rate limit and its headers | `frontend/lib/public-api/rate-limit.ts` |
| No unrevealed score, no private field | `frontend/lib/public-api/visibility.ts` |
| Responses match the document | `frontend/tests/public-api/contract.test.ts` |

A promise with no test is a hope, so each row above has one.
