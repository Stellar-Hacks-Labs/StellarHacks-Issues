# Testnet reset

Friendbot-funded accounts emptied, or the test network wiped state the stack
depended on.

## Service accounts

```bash
cd backend/sealer && npm run doctor
cd ../clock && npm run doctor
```

If funding checks fail, fund the public keys again (friendbot or a funded
identity). Re-run the doctor until both print a funded balance.

## Contracts

Testnet contract instances listed in `docs/deployments.md` may disappear after a
network reset. Redeploy from the published wasm hashes, update
`docs/deployments.md` with the new addresses, and point `WATCH_CONTRACT` (and
any frontend env) at the new core instance.

```bash
cd contracts
stellar contract build
# upload and deploy per docs/deployments.md
cd ../backend/indexer
npm run doctor
```

Expected: if `WATCH_CONTRACT` is set, the contracts check passes against the
updated deployments file.

## Database

Projections are disposable. After pointing at new contracts, drop and rebuild
derived tables by letting the indexer follow from the retention edge, or
truncate projections and re-ingest. Durable `chain_events` / `chain_reads` from
the old network are not meaningful on the new one — archive them off-box if
needed, then clear.

## Verification

```bash
cd backend
npm run doctor --prefix indexer
npm run doctor --prefix sealer
npm run doctor --prefix clock
npm run doctor --prefix reviewer
npm run dev
```

Expected: every doctor exits `0`; the stack stays up against the new testnet
state.
