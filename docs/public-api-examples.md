# Worked examples

Every response below is the shape `frontend/tests/public-api/contract.test.ts`
validates against the served document. Amounts are strings because they are
`i128` on chain; scores are integers at the contract's own scale.

## List the events

```sh
curl -s https://stelhacks.app/api/v1/hackathons?limit=2
```

```json
{
  "items": [
    {
      "contract": "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
      "slug": "an-event",
      "name": "An event",
      "tagline": null,
      "phase": 4,
      "phaseName": "Judging",
      "visibility": 0,
      "logoUrl": null
    },
    {
      "contract": "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE",
      "slug": "a-finished-event",
      "name": "A finished event",
      "tagline": "It paid out",
      "phase": 7,
      "phaseName": "Settlement",
      "visibility": 0,
      "logoUrl": "https://example.test/logo.png"
    }
  ],
  "nextCursor": "djE6MjAyNi0xMC0wMVQwMDowMDowMC4wMDBafENBM0Q1S1JZ"
}
```

Response headers worth reading:

```
ratelimit-limit: 60
ratelimit-remaining: 59
ratelimit-reset: 1764115200
cache-control: public, max-age=30, stale-while-revalidate=120
```

## Page through all of them

```js
const items = [];
let cursor = null;

do {
  const query = new URLSearchParams({ limit: "100" });

  if (cursor !== null) {
    query.set("cursor", cursor);
  }

  const response = await fetch(`https://stelhacks.app/api/v1/hackathons?${query}`);

  if (response.status === 429) {
    // The limiter says how long, so there is no need to guess.
    await new Promise((wake) => setTimeout(wake, Number(response.headers.get("retry-after") ?? 60) * 1000));
    continue;
  }
  if (!response.ok) {
    const { error } = await response.json();

    throw new Error(`${error.code}: ${error.message}`);
  }

  const page = await response.json();

  items.push(...page.items);
  cursor = page.nextCursor;
} while (cursor !== null);
```

Two things this loop does on purpose: it waits the number of seconds the API
asked for rather than backing off blindly, and it stops on `nextCursor === null`
rather than on an empty page — the API never issues a cursor that opens one.

## One event, and checking its rules

```sh
curl -s https://stelhacks.app/api/v1/hackathons/a-finished-event
```

```json
{
  "contract": "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE",
  "slug": "a-finished-event",
  "name": "A finished event",
  "tagline": "It paid out",
  "phase": 7,
  "phaseName": "Settlement",
  "visibility": 0,
  "logoUrl": "https://example.test/logo.png",
  "description": "# A finished event",
  "websiteUrl": "https://example.test",
  "organizer": "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
  "constitutionHash": "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd",
  "prizeAsset": "CBASSETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
  "vault": "CBVAULTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
  "teams": 3,
  "submissions": 3
}
```

`constitutionHash` is the field this route exists for. Rebuild the rules from
the event's public page, hash them with `@stelhacks/sdk`'s `hashConstitution`,
and compare: if the two differ, the competition being run is not the one that
was announced. Nothing else on this response needs to be trusted for that check
to work.

## Results before and after a reveal

Before (`phase: 4`):

```json
{
  "items": [
    {
      "track": "ai",
      "revealed": false,
      "placements": [
        { "rank": 1, "team": 2, "finalScore": null, "judgeAverage": null, "community": null,
          "decidedBy": null, "paidAmount": null, "paidTxHash": null }
      ]
    }
  ],
  "nextCursor": null
}
```

The placing is there because the contract ranked publicly; every score is
`null` because the scorecards are still sealed. `revealed: false` is what says
which of the two cases a reader is looking at — a zero would read as a score.

After (`phase: 7`):

```json
{
  "items": [
    {
      "track": "ai",
      "revealed": true,
      "placements": [
        { "rank": 1, "team": 1, "finalScore": 9000, "judgeAverage": 9000, "community": 0,
          "decidedBy": 0, "paidAmount": "3000",
          "paidTxHash": "abababababababababababababababababababababababababababababababab" }
      ]
    }
  ],
  "nextCursor": null
}
```

## Proof for one event

```sh
curl -s https://stelhacks.app/api/v1/hackathons/a-finished-event/proof
```

```json
{
  "contract": "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE",
  "phase": 7,
  "revealed": true,
  "constitutionHash": "cdcd…cdcd",
  "scoreRoot": "1111…1111",
  "ballotRoot": null,
  "vault": "CBVAULTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
  "prizeAsset": "CBASSETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
  "payments": [
    {
      "track": "ai",
      "rank": 1,
      "recipient": "GCWINNER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
      "amount": "3000",
      "kind": 0,
      "ledger": 5100,
      "txHash": "abab…abab"
    }
  ]
}
```

`ballotRoot: null` here means this event was decided by its judges and had no
community vote — or that the chain could not be reached for it. The two are
indistinguishable in this field on purpose: a route that guessed would be
guessing about the one value that exists so nobody has to guess. The event's own
rules say whether a community vote was configured.

`kind` keeps the three endings apart, and they must never be shown as one:

| `kind` | Meaning |
|---|---|
| `0` | paid to a winner |
| `1` | swept back after the claim period expired |
| `2` | returned because the track made no award |

## The two failures worth handling

A slug nobody published:

```sh
curl -s -i https://stelhacks.app/api/v1/hackathons/not-a-thing
```

```
HTTP/2 404
content-type: application/json

{ "error": { "code": "not_found", "message": "No such hackathon.", "detail": "not-a-thing" } }
```

A source this API reads being unreachable:

```
HTTP/2 503

{ "error": { "code": "unavailable", "message": "A source this API reads could not be reached.",
             "detail": "no database is configured for this deployment" } }
```

`503` and not `500`, and not an empty list: "no hackathons" and "the database
did not answer" are different facts, and a dashboard retrying on a schedule has
to be able to tell them apart.

## Generate a client

```sh
curl -s https://stelhacks.app/api/v1/openapi.json -o stelhacks.json
npx --yes @openapitools/openapi-generator-cli generate -i stelhacks.json -g typescript-fetch -o ./stelhacks-client
```

Operation ids are stable within a version (`listHackathons`, `getHackathon`,
`listProjects`, `listResults`, `getProof`), so a generated client's method names
are too.
