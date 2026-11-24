# Incident template

Copy this into the incident channel or ticket. Fill every field before closing.

```text
Date (UTC):
Severity: (sev1 | sev2 | sev3)
Services affected: (indexer | sealer | clock | reviewer | frontend | contracts)
Hackathon / contract id (if any):

Summary (one sentence):

Detection:
- Who / what noticed:
- First symptom:
- Doctor output (paste):

Timeline (UTC):
- HH:MM  …
- HH:MM  …

Impact:
- Users / phases affected:
- Funds at risk: (yes/no — if yes, stop and escalate)

Actions taken:
1.
2.

Resolution:
- What fixed it:
- Verification commands and output:

Follow-ups:
- [ ] Update the relevant runbook
- [ ] File or update a decision if behaviour changed
- [ ] Rotate any exposed secret (see key-rotation.md)
```

## Severity guide

| Level | Meaning |
|---|---|
| sev1 | Funds movement wrong, or results computable incorrectly |
| sev2 | A live judging or voting window cannot progress |
| sev3 | Degraded lag, single service down outside a critical window |
