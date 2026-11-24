# Evidence bundle

The proof page can export a self-contained archive of one hackathon. The zip holds the frozen constitution, every indexed event, the sealed Merkle roots, the reveal disclosures, and the payouts, together with a SHA-256 manifest. A reader who keeps the file can check it later with the SDK without talking to this site or to an RPC node.

## Where it lives

- Assembly: `frontend/lib/bundle/`
- Download route: `GET /api/bundle?contract=<id>` (zip) and `?preview=1` (JSON size and contents)
- Proof page control: `frontend/app/hackathons/[slug]/proof/bundle-download.tsx`
- Offline check: `@stelhacks/sdk` `checkBundle` and `stelhacks-bundle check <file.zip>`

## What is excluded

Sealed scorecards and ballots that have not been revealed never enter the archive. The collector reads only `chain_events` and `chain_reads`. Any ciphertext that somehow reaches the serializer is stripped before the bytes are hashed.

## Determinism

Two exports of the same durable log are byte-identical. JSON keys are sorted, JSONL order follows ledger then event index, and the zip uses the STORE method with a fixed 1980-01-01 timestamp.

See `docs/evidence-bundle-format.md` for the on-disk layout.
