# The credential format

`stelhacks.credential.v1` — signed JSON a builder can hand to somebody who has
never heard of this platform.

## One credential

```json
{
  "version": "stelhacks.credential.v1",
  "subject": {
    "address": "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K",
    "username": "ada"
  },
  "claim": {
    "kind": "placement",
    "track": "ai",
    "rank": 1,
    "team": 3,
    "finalScore": 9000
  },
  "evidence": {
    "contract": "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
    "slug": "a-finished-event",
    "constitutionHash": "cdcd…cdcd",
    "payoutTxHash": "abab…abab",
    "submissionDigest": "1111…1111",
    "scoreRoot": "2222…2222"
  },
  "issuer": {
    "keyId": "GDVEU3DD4KOFECV66VIHWEZOYX4ZKR3WV27L464SIIPOU2IUI3JCZA57",
    "signedAt": "2026-11-21T10:00:00.000Z"
  },
  "signature": "9e95…"
}
```

### `subject`

| Field | Meaning |
|---|---|
| `address` | The Stellar account the chain recorded doing this. **The claim is about a key, not a person** — see `docs/credentials-trust.md`. |
| `username` | This platform's handle for that address, or `null`. A convenience for a human reader; it establishes nothing. |

### `claim`

Two kinds, and a credential carries exactly one.

**`placement`** — this subject's team placed, in a track, at an event that has
**revealed**:

| Field | Meaning |
|---|---|
| `track` | The track, as the frozen rules name it. |
| `rank` | `1` is first. The contract refuses a prize table containing rank zero, so a placement claiming it is a claim about nothing. |
| `team` | The team number the contract assigned. |
| `finalScore` | The combined score at the contract's own scale, or `null`. |

**`participation`** — this subject took part, in a role, without a placement
claim:

| Field | Meaning |
|---|---|
| `role` | `builder`, `judge`, `organizer` or `sponsor`. |
| `team` | Their team number, or `null` for a role that has none. |

A placement is **never** claimed for an event that has not revealed, even when
the ranking already exists: the placing is public once the contract has ranked,
but the scores are sealed until the reveal, and a credential is pasted into
forms by people who will not read a footnote. Such an event yields a
participation claim instead.

### `evidence`

Everything here is readable by a stranger from the chain. A credential whose
evidence pointed back at the page that issued it would prove nothing.

| Field | Meaning |
|---|---|
| `contract` | The hackathon contract. The identity everything else keys on. |
| `slug` | This platform's page for it, or `null`. For a human reader, not for the check. |
| `constitutionHash` | Digest of the frozen rules — which competition this was. |
| `payoutTxHash` | The transaction that paid that placing, when one was paid. |
| `submissionDigest` | The digest the contract pinned for the team's entry. |
| `scoreRoot` | The root committing to every sealed scorecard. |

Any of them may be `null`, and `null` means *not cited* rather than *does not
exist*: the issuing route reads a database and not the chain, so it leaves
`scoreRoot` null rather than citing our own copy of a value that exists so
nobody has to trust us.

### `issuer`

| Field | Meaning |
|---|---|
| `keyId` | The platform's signing key, as a Stellar public key. Compare it against the key the platform publishes — a signature that verifies against a key nobody recognises proves only that whoever made the credential also made the key. |
| `signedAt` | When the credential was assembled, ISO 8601. Not when the achievement happened; that is the chain's. |

## The signature

1. Take the credential **without** its `signature` field.
2. Canonicalize: JSON with object keys sorted and no whitespace, `undefined`
   dropped. Two readers whose JSON libraries order keys differently must hash
   the same bytes, or a credential that passed through a formatter would look
   forged.
3. Hash `stelhacks.v1.credential:<canonical JSON>` with SHA-256. The domain tag
   is what keeps a credential digest from ever colliding with a constitution's
   or a scorecard leaf's.
4. Sign that digest as **hexadecimal text under SEP-53** — the prefix
   `Stellar Signed Message:\n`, then SHA-256, then Ed25519. The same scheme a
   judge's scorecard signature uses, so a credential signature is verifiable by
   anything that already knows how to check one of those.

The digest from step 3, as hex, is also the credential's **id**: a stable name
for one credential that changes if any field changes.

## Checking one

```ts
import { verifyCredential, changedFields } from "@stelhacks/sdk";

const report = verifyCredential(credential, observed);
// report.format     — is this a credential at all
// report.signature  — did the platform sign this exact one
// report.evidence   — does the claim match the records you fetched
// report.coverage   — what your records could not confirm either way
changedFields(report); // the fields that do not match
```

Three layers, reported separately because they answer different questions. The
third is the one that needs no trust in the issuer, and `report.evidence` is
`null` when you supplied no records — which is said plainly rather than counted
as a pass.

A worked example, including fetching the records from the public API, is
`sdk/examples/verify-credential.ts`.

## Versioning

`version` is checked exactly. A reader that does not know a version must refuse
the credential rather than interpret the fields it recognises — a credential is
a claim about somebody's history, and a partial reading of one is worse than a
refusal. A new version will be a new string, and the committed fixtures in
`fixtures/credentials/` will gain a set for it.
