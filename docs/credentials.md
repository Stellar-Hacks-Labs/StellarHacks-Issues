# Builder credentials

Decision 8 says a builder's profile is derived from records rather than from
declarations. Until now that derivation lived inside this website, which means
the honest version of somebody's history was something only we could compute —
and a builder applying for a job, a grant or a delegation could not hand it
over.

A credential is that derivation, written down, signed, and pointing at the
chain.

## What a builder does

1. Opens their own profile and connects the wallet they took part with. A
   credential is about a **key**, because a key is what the chain recorded.
2. Presses **Export credentials**. The route reads the records — the ranking,
   the team membership, the payments — builds one claim per placement or
   participation, signs each with the platform key and hands back signed JSON.
3. Downloads the file and sends it to whoever asked.

## What the recipient does

Either of these, and the second is the one that matters:

- Paste it into **`/verify`**. The signature is checked **in the reader's own
  browser** — arithmetic, no request to us — and the page says whether the
  signer is the key this deployment publishes. Everything about the claim is
  presented as links to the chain rather than as our verdict.
- Run the SDK against the chain:

  ```sh
  STELHACKS_API=https://stelhacks.app/api/v1 \
    npx vite-node examples/verify-credential.ts ./credential.json
  ```

  This is the check that needs nothing from us: it compares the claim field by
  field against the ranking, the payments and the rules digest, and names every
  field that disagrees.

## Why both, and why they are kept apart

The signature establishes one thing: this platform assembled this exact
credential and nothing in it has changed. It says **nothing** about whether the
claim is true. A credential with a perfect signature and a false claim is
exactly what this format exists to make impossible to pass off, and the only
thing that catches it is the comparison against the chain.

So the two are never collapsed into one tick. `/verify` reports them as separate
answers, the SDK returns them as separate fields, and a reader who stops at the
signature has been told, in words, what they have and have not established.

## The three rules it keeps

**A placement is only claimed for a revealed event.** Before the reveal the
scores are sealed; the placing is public but the numbers are not, and a
credential carrying one would carry something nobody is supposed to have yet.
Such an event yields a participation claim instead.

**Nothing is claimed that the records do not contain.** The claims are derived
by the issuing route from what it read. A request cannot ask for a credential
saying something else — `app/api/credentials/route.test.ts` sends a flattering
claim in the body and asserts the answer is the ranking's.

**The signing key never reaches the browser.** It is read from
`STELHACKS_CREDENTIAL_SECRET`, which has no `NEXT_PUBLIC_` prefix and so is
never inlined into a client bundle, and `signingKeypair()` throws if it is ever
called where `window` exists. The public key id travels on every credential,
because a signature nobody can attribute is worth nothing.

## What it is not

- **Not a wallet format.** Third-party credential wallets are out of scope, as
  the issue says. This is a JSON file with a signature; anything that wants to
  hold it can.
- **Not an identity claim.** A credential is about an address. Whether a person
  holds that address is between them and whoever they hand it to — see
  `docs/credentials-trust.md`.
- **Not revocable.** There is no revocation list and no expiry. A credential
  states what the chain recorded, and that does not stop being true; if the
  claim is wrong, the evidence check says so, which is a better answer than a
  list we would also be asking to be trusted about.

## Where it lives

| Layer | Path |
|---|---|
| Format, digest, canonical form | `sdk/src/credentials/format.ts` |
| Verification, all three layers | `sdk/src/credentials/verify.ts` |
| The claim against the chain | `sdk/src/credentials/evidence.ts` |
| Signed fixtures the two sides agree on | `fixtures/credentials/` |
| Claims from records | `frontend/lib/credentials/build.ts` |
| Signing, and the key's one rule | `frontend/lib/credentials/sign.ts`, `keys.ts` |
| Issuing route | `frontend/app/api/credentials/route.ts` |
| Export control | `frontend/app/u/[username]/export-credentials.tsx` |
| Verification page | `frontend/app/verify/` |
| Command line example | `sdk/examples/verify-credential.ts` |

The format field by field is `docs/credentials-format.md`; what a reader is
trusting, and what they are not, is `docs/credentials-trust.md`.
