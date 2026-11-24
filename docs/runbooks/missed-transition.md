# Missed transition

A phase deadline passed and the clock did not advance it.

The contract still enforces the deadline: nothing illegal becomes legal because
the clock slept. What is missing is the public call that moves the phase on.

## Diagnose

1. Confirm the clock process is running and its doctor is clean:

```bash
cd backend/clock
npm run doctor
npm start
```

Expected: doctor exits `0`; the process logs a lap on the configured interval
(`CLOCK_EVERY_MS`, default 120000).

2. Confirm the fee-paying account still has lumens (doctor funding check).
3. Confirm RPC answers (doctor rpc check). A stuck RPC looks like a missed
   transition until the probe fails.

## Manual advance

Anybody with a funded account can send the same call the clock sends. From a
machine with the SDK and a funded key:

```bash
# Using the manage page in the web application, or a one-off script that
# simulates then submits advance_phase / the due entry point for that phase.
```

Expected: the contract accepts the call once the deadline has passed and any
preconditions (for example a published score root before leaving judging) are
met. If the contract refuses, the clock was not late — a precondition is unmet.
Read the refusal code; do not keep submitting.

## After the catch-up

Leave the clock running. A single manual advance does not replace it: the next
deadline will need the same call again.
