# Verifier fixtures

Offline inputs for the independent verifier in `@stelhacks/sdk`.

| File | Role |
|---|---|
| `reference-state.json` | Constitution, disclosures, tallies, rankings, payouts and tlock claim that agree with each other |
| `reference-events.json` | Named disclosure events carrying the same scorecards and ballots |
| `tampered-state.json` | Same as reference except the payments ranking is swapped and the score root is zeroes — the verifier must disagree |

No network is required. The SDK suite loads these through `--state` / `--events`
and asserts agreement on the reference set and a specific disagreement on the
tampered set.
