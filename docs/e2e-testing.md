# End-to-end journeys

Playwright drives a browser against a freshly seeded testnet instance. The seed step runs the existing scripts in `frontend/scripts`. It does not contain its own chain transactions. `frontend/scripts/lib/steps.mts` names which script each journey uses.

`frontend/scripts/lib/keys.mts` refuses any passphrase other than the Stellar testnet passphrase. A journey never receives a funded mainnet key.

Set `E2E_BASE_URL` to the seeded site. Without it, each spec skips, because there is no instance to walk.

Failures keep a Playwright trace. The workflow uploads `frontend/test-results` when the job fails.
