# Operator runbooks

Procedures an operator runs against a live stack. Each runbook names the exact
commands and the output that means the step worked. Configuration checks that
belong before a start live in the per-service doctor (`npm run doctor` in
`backend/indexer`, `sealer`, `clock`, or `reviewer`).

| Runbook | When to use it |
|---|---|
| [First deployment](first-deployment.md) | Standing the stack up on a new environment |
| [Key rotation](key-rotation.md) | Replacing a sealer or clock secret |
| [Indexer cursor recovery](indexer-cursor-recovery.md) | Cursor stranded or gaps open after an outage |
| [Missed transition](missed-transition.md) | A phase deadline passed and the clock did not advance it |
| [Sealer outage during judging](sealer-outage.md) | Sealer down while a scoring or voting window is open |
| [Reviewer backlog](reviewer-backlog.md) | Pre-review queue stuck or growing |
| [Testnet reset](testnet-reset.md) | Friendbot-funded accounts emptied or network wiped |
| [Incident template](incident-template.md) | Recording what happened so the next pass is shorter |

## Doctor

Before any of the above, and before `npm start` on a service:

```bash
cd backend/shared && npm test          # shared doctor helpers
cd ../indexer && npm run doctor
cd ../sealer  && npm run doctor
cd ../clock   && npm run doctor
cd ../reviewer && npm run doctor
```

A doctor exits `0` only when every check passed. Failure lines are prefixed with
a class (`env`, `network`, `rpc`, `contracts`, `funding`) so a script can match
them. Doctors never sign or submit transactions.
