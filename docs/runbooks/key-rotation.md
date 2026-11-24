# Key rotation

Replacing a sealer or clock secret without automating the rotation itself.

Automation of key rotation is out of scope for the doctor issue. This runbook
is the manual procedure.

## Sealer

The sealer address is named in the constitution as the party allowed to publish
a root. Rotating it means a new constitution (or a new hackathon) if the locked
document already names the old address. For services that have not yet locked
rules against the old key:

1. Generate a new keypair offline. Do not commit it.
2. Fund the new public key on the target network.
3. Set `SEALER_SECRET_KEY` in `backend/.env.local` to the new secret.
4. Restart the sealer.
5. Confirm:

```bash
cd backend/sealer
npm run doctor
```

Expected: `funding: SEALER_SECRET_KEY: account G… funded …` and
`all checks passed`.

6. Record the new public key wherever operators keep the deployment inventory.
   Update any unlocked constitution drafts that still name the old address.

## Clock

The clock key pays fees only. Anybody with a funded account can send the same
calls, so rotation does not change contract authority:

1. Generate and fund a new keypair.
2. Set `CLOCK_SECRET_KEY` in `backend/.env.local`.
3. Restart the clock.
4. Confirm:

```bash
cd backend/clock
npm run doctor
```

Expected: funding check passes for the new account.

## After rotation

Keep the old secret offline until every in-flight receipt or fee payment that
could still reference it has settled, then destroy it.
