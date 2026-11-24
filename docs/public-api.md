# The read-only public API

`/api/v1` — hackathons, projects, results and proofs, as the chain and the
indexer recorded them.

Ecosystem dashboards and the observer user class need machine-readable access,
and the application's own `/api` routes are not that: they serve this product's
pages and change whenever a page does. This is the stable surface, and the
difference between the two is a promise about change rather than a difference in
technology — see `docs/public-api-versioning.md` for exactly what is promised.

## The routes

| Route | Answers |
|---|---|
| `GET /api/v1/hackathons` | Every event, newest first. Paged. |
| `GET /api/v1/hackathons/{slug}` | One event, with the digest of its frozen rules. |
| `GET /api/v1/hackathons/{slug}/projects` | Its entries, as the public gallery shows them. Paged. |
| `GET /api/v1/hackathons/{slug}/results` | The ranking by track. Scores are null until the reveal. |
| `GET /api/v1/hackathons/{slug}/proof` | The digests, the sealed roots and every payment out of the vault. |
| `GET /api/v1/openapi.json` | This API's own description. |

No write endpoints and no API keys. Everything served here is already public, so
there is nothing to authenticate and nothing a key could protect. The issue puts
both out of scope and they should stay there: a key would turn a public read
into an account relationship, and a write endpoint would make this API a second
way to change state that the contract is the authority on.

## Authorization, such as it is

There is none, and that is deliberate. Every route reads with the **anonymous**
key, so row level security has already decided what a stranger may see before
any shaping happens: a restricted event serves no project rows, a sealed
scorecard is unreachable by construction. There is no service role anywhere
under `app/api/v1`.

Two things are therefore true by construction rather than by remembering:

- **No score before its event's reveal.** The contract ranks publicly, so a
  placing is public as soon as it exists — but the numbers behind it are sealed
  until phase five, and this API serves `null` with `revealed: false` beside it
  rather than a zero that would read as a score. The only input to that decision
  is `hackathon_state.phase`; no query parameter, header or body can open it
  early.
- **No private profile field.** This API lists events, projects and results. No
  part of its purpose needs somebody's email, their country or their account
  identity, so the published shapes do not carry them and
  `frontend/tests/public-api/visibility.test.ts` checks every route's answer for
  them by name.

## Paging

Cursor, not offset. An offset over a list that grows while somebody pages
through it silently skips or repeats rows, and these lists grow: events are
created, entries are submitted.

```
GET /api/v1/hackathons?limit=25
→ { "items": [...], "nextCursor": "djE6..." }

GET /api/v1/hackathons?limit=25&cursor=djE6...
```

`limit` is 1 to 100, default 25. `nextCursor` is `null` on the last page — and
only on the last page: reads ask for one row more than the page needs, so a
cursor never opens an empty page.

The cursor is **opaque**. It is base64 of a versioned internal key, and a
cursor this API did not produce is refused with `invalid_cursor` rather than
coerced into a page. A consumer that reads it will eventually construct one, and
then the key inside it is a part of the contract nobody meant to promise.

## Errors

One shape, so a consumer writes one error branch:

```json
{ "error": { "code": "not_found", "message": "No such hackathon.", "detail": "an-event" } }
```

| Code | Status | When |
|---|---|---|
| `invalid_request` | 400 | A parameter this API cannot answer with. `detail` names it. |
| `invalid_cursor` | 400 | A cursor that did not come from here. |
| `not_found` | 404 | No event is published at that slug. |
| `rate_limited` | 429 | Over the window. `retry-after` says how long. |
| `unavailable` | 503 | A source this API reads could not be reached. |

The status travels with the code in one catalogue, so the same condition never
answers 400 on one route and 422 on another. `503` rather than `500` for an
unreachable source is the distinction a dashboard retrying on a schedule needs:
the API is fine and something it reads is not.

An unreachable source is never reported as an empty answer. "No hackathons" and
"the database did not answer" are different facts and must not render the same.

## Rate limits

60 requests per 60 seconds per client address. Every answer carries:

```
ratelimit-limit: 60
ratelimit-remaining: 57
ratelimit-reset: 1764115200
```

and a refusal adds `retry-after`. A limiter that only says no teaches a client
to retry blindly.

Two honest limits on this. The client key is the first entry of
`x-forwarded-for`, which is spoofable — this is a fairness measure for ordinary
consumers, not a security control, and nothing behind it is private. And the
window is held in memory, so a deployment running four instances allows four
windows; the alternative is a shared store on the read path of every public
request.

## Caching

The policy follows the event rather than the route:

| Answer | `cache-control` |
|---|---|
| A listing | `public, max-age=30, stale-while-revalidate=120` |
| One event mid flight | `public, max-age=15, stale-while-revalidate=60` |
| One event that has settled | `public, max-age=3600, stale-while-revalidate=86400` |
| The document | `public, max-age=300, stale-while-revalidate=3600` |
| Anything unanswerable | `no-store` |

`next.config.ts` installs the listing policy as a floor for the whole prefix, so
a new route cannot ship as uncacheable by accident. It imports the value from
`lib/public-api/cache.ts`, so the config and the routes cannot disagree.

## The document is the contract

`/api/v1/openapi.json` is composed at request time from the same modules the
routes answer with — the schemas, the error catalogue, the paging bounds, the
rate limit and the cache policy. It cannot be stale, because there is no second
copy to go stale.

`frontend/tests/public-api/contract.test.ts` closes the loop from the other
side: every operation the document declares is called, and its real response is
validated against the schema the document publishes. Every shape declares
`additionalProperties: false`, so a column forwarded by accident fails a test
rather than becoming a de facto part of the API.

Worked examples, including a paging loop and the two failure cases, are in
`docs/public-api-examples.md`.
