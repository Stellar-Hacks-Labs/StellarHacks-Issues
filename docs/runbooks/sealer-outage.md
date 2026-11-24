# Sealer outage during judging

The sealer is down while a scoring or voting window is open.

## What is at risk

Judges and voters can still write sealed cards into durable storage once the
service returns, but a root can only be published while the hackathon is in the
judging phase. If the clock is about to advance past judging and the root is
not on chain, the transition will refuse until the root lands.

## Immediate actions

1. Run the sealer doctor and restore configuration if it fails:

```bash
cd backend/sealer
npm run doctor
```

2. Restart the sealer:

```bash
npm start
```

Expected: the HTTP server listens on `SEALER_PORT` (default 8787); health or a
trivial GET to the service responds.

3. Confirm sealed cards that arrived during the outage are still in the store
   (Supabase `scorecards` / `ballots` tables reachable with the service role).
4. If a judging window has already closed and the root was not published, bring
   the sealer up and let it publish before retrying the clock's advance. Do not
   force the phase forward without the root — the contract will refuse, and that
   refusal is correct.

## Extending a deadline

If judging is about to expire and the sealer cannot return in time, the
organizer's deadline-extension path (bounded by the locked constitution) is the
documented escape. Record the reason hash. Do not invent an off-chain bypass.

## After recovery

Walk one sealed card through seal → receipt → root publish on a non-production
hackathon, or wait for the sealer's own round loop to publish on the live event,
then confirm the clock can advance.
