# Evidence bundle format

Format name: `stelhacks-evidence-bundle`  
Current version: `1`

## Layout

A version 1 archive is a ZIP file written with the STORE method (no compression). Entry timestamps are fixed at 1980-01-01 00:00:00 DOS time. Paths appear in this order:

| Path | Contents |
|---|---|
| `manifest.json` | Format header and a SHA-256 listing of every other file |
| `constitution.json` | Latest `chain_reads` row with `kind = constitution`, or `null` |
| `events.jsonl` | Every `chain_events` row for the contract, ledger then event index |
| `roots.json` | `{ "score_root", "ballot_root" }` taken from the root-published events |
| `disclosures.jsonl` | `ScoreRevealed` and `BallotCounted` events |
| `payouts.jsonl` | `PrizePaid`, `PlatformFeeSettled`, and related payout events |

## Manifest

```json
{
  "format": "stelhacks-evidence-bundle",
  "version": 1,
  "contract_id": "C…",
  "files": [
    { "path": "constitution.json", "sha256": "…", "bytes": 123 }
  ]
}
```

`manifest.json` is not listed inside `files`. Digests are lowercase hex SHA-256 of the exact file bytes.

## JSON rules

- Objects use lexicographically sorted keys at every depth.
- JSONL files use LF line endings and end with a trailing newline when non-empty.
- An empty JSONL file is the empty byte string.

## Versioning

Bump `version` when a required path is renamed or reshaped so that an older verifier would misread it. Adding an optional path does not require a bump; removing or renaming a required path does.
