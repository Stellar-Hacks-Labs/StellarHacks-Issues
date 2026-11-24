# Verifying the sealer audit log

Fetch `/audit?contract=…` and `/audit/checkpoints?contract=…`. Run `verifyAuditLog`, then verify each checkpoint with `verifyAuditCheckpoint` and the sealer key frozen in the constitution.
