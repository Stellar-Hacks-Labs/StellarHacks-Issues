# Independent verifier

A command-line tool in `@stelhacks/sdk` that recomputes a hackathon's result from
public chain data and reports any disagreement with what the contract published.

It exists so a participant can establish a placement without consulting the
organizer or trusting the website. The only network it talks to is Stellar RPC.
There is no Supabase client, no sealer API call, and no dependency on the web
application.

## Install and run

From the SDK package:

```bash
cd sdk
npm run build
npx stelhacks-verify C<contract-id> --network testnet
```

Offline, against the committed fixtures:

```bash
npx stelhacks-verify \
  --state ../fixtures/verify/reference-state.json \
  --events ../fixtures/verify/reference-events.json \
  --format text
```

JSON output is available with `--format json` for piping into other tools.

The example at `sdk/examples/verify-result.ts` remains a short walkthrough of the
same idea; the CLI is the packaged entry point.

## What it reads

| Source | Used for |
|---|---|
| `constitution` / `constitution_hash` | Prove the rules served are the rules that locked |
| `score_root` / `ballot_root` | Compare against roots rebuilt from disclosures |
| Disclosed scorecards and ballots | Leaves for Merkle roots and ballot tallies |
| Submissions, tallies, vote weights | Inputs to `rankTrack` |
| `ranking` / `payable` | Published order and prize amounts |
| Judging deadline + claimed Drand round | Tlock round check from public quicknet constants |

Live mode simulates contract getters over RPC. When disclosures are not yet
available on chain as a public dump, pass them with `--state` / `--events` the
same way the reference fixtures do.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Every check agreed |
| `1` | At least one disagreement |
| `2` | Usage or load error |

See [verifier-checks.md](./verifier-checks.md) for what each named check proves.
