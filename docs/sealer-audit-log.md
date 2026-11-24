# Sealer audit log

Every admitted sealed input is committed to an append-only SHA-256 chain. Entries contain only hashes and public identifiers. A failed append aborts intake before the sealed row is written.
