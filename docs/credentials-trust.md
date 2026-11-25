# What a credential asks you to trust

A credential carries a signature from this platform and links to the chain. The
two are worth very different amounts, and this page is the honest accounting of
which is which.

## What the signature establishes

**That this platform assembled this exact credential, and nothing in it has
changed since.** That is all.

It does not establish that the claim is true. We derive claims from records we
read, and we could read them wrong, read a stale copy, or — if somebody took our
signing key — not be the ones signing at all. A reader who stops at the
signature has chosen to trust us exactly as much as they would have trusted a
screenshot of the profile page.

## What the evidence establishes

**That the claim matches what the chain recorded** — and that needs nothing from
us at all.

```sh
STELHACKS_API=https://stelhacks.app/api/v1 \
  npx vite-node examples/verify-credential.ts ./credential.json
```

The comparison is field by field: the rank against the published ranking, the
score against it too, the team against the chain's team membership, the payout
against the ledger, the rules digest against the event's own. Every field that
disagrees is named. A credential that passes this is one whose claim is true
whatever you think of us.

This is the check worth running, and it is why the format carries evidence links
at all.

## The three trust assumptions a reader cannot avoid

**1. The key id.** A signature verifies against the key the credential names, so
a credential that names its own freshly made key verifies perfectly. "Valid
signature" means nothing until the key id is the one this platform publishes —
at `/verify`, in `NEXT_PUBLIC_STELHACKS_CREDENTIAL_KEY_ID`, and on every
credential this deployment issues. `sdk/test/credentials/signature.test.ts`
pins this case deliberately: a stranger's key signing the same bytes is reported
as **valid**, and the key id is what tells the two apart.

**2. The address is a key, not a person.** A credential says the account
`G…` placed first. Whether the person handing it to you holds that account is
outside this format: ask them to sign a challenge with it. The `username` field
is a convenience for reading and establishes nothing — this platform's
`wallet_links` is the only join between an account and a profile, and a reader
has no reason to take our word for it.

**3. The indexer, for anything you do not check yourself.** The issuing route
reads derived tables — the ranking, the payments, team membership — which the
indexer wrote from chain events. If it is behind, a credential can be assembled
from stale records. The evidence check against the chain is what closes that
gap, which is the third time this page says the same thing, because it is the
only thing that matters.

## What the platform deliberately cannot do

- **Sign a claim a request asked for.** Claims are derived from the records the
  route read; the request only names an address, and that address is public.
- **Issue a score before its event's reveal.** Pre-reveal events yield
  participation claims, so a credential never carries a sealed number.
- **Leak the signing key.** It has no `NEXT_PUBLIC_` prefix, so Next never
  inlines it into a client bundle, and the loader throws where `window` exists.
- **Revoke one.** There is no revocation list. A credential states what the
  chain recorded; if the claim is false the evidence check says so, and a list
  only we could publish would be one more thing to take on trust.

## If the signing key is ever compromised

The platform publishes a new key id and the old one stops being the one this
deployment names. Credentials signed by the old key keep verifying *against the
old key* — that is arithmetic and cannot be undone — so they become credentials
whose signer is no longer us, which `/verify` says in those words.

Nothing about the claims changes, because the claims were never what the
signature established. A reader who ran the evidence check has an answer that
survives the key entirely, and that is the design: the signature is a
convenience, the chain is the proof.
