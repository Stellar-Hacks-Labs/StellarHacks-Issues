# First deployment

Standing contracts, the database, and the four long-lived services on a fresh
environment.

## Preconditions

- Stellar CLI logged into the target network identity
- `backend/.env.local` copied from `backend/.env.example` and filled
- Supabase project linked from `backend/`

## Steps

### 1. Build and record the contracts

```bash
cd contracts
stellar contract build
```

Expected: two Wasm Hash lines. Copy them into `docs/deployments.md` under the
Code table when they differ from what is already there, then upload and deploy
as that document describes.

### 2. Apply the schema

```bash
cd backend
supabase db push
cd supabase/tests && npm test
```

Expected: migrations apply cleanly; role tests exit `0`.

### 3. Fund service accounts

On testnet, fund the public keys derived from `SEALER_SECRET_KEY` and
`CLOCK_SECRET_KEY` (friendbot or a funded identity). The doctor will refuse to
pass until Horizon sees at least 1 XLM on each.

### 4. Run every doctor

```bash
cd backend/indexer && npm run doctor
cd ../sealer && npm run doctor
cd ../clock && npm run doctor
cd ../reviewer && npm run doctor
```

Expected: each prints `all checks passed` and exits `0`.

### 5. Start the stack

```bash
cd backend
npm run dev
```

Expected: indexer, sealer, clock, and reviewer processes stay up; the sealer
listens on the configured port (default 8787).

## Related

- `docs/deployments.md` — addresses and wasm hashes
- `backend/README.md` — environment file boundary
