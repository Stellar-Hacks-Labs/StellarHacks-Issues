# Issues

Append-only log of issues worked in this fork.

## #11 — Proof: Export a self-contained evidence bundle for a completed hackathon

- Branch: `feat/evidence-bundle-export`
- Adds a deterministic zip export from `chain_events` and `chain_reads`, a proof-page download control, and an SDK offline check over the hash manifest.
- Sealed, unrevealed inputs are redacted and never shipped in the archive.
