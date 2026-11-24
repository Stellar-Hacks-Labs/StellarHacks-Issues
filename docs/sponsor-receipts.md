# Sponsor receipts

Problem P7 in the README is that a sponsor cannot demonstrate funds were
distributed as announced. The contributions were recorded and the payouts were
recorded; nothing joined them, so a sponsor asking the question had to be told
rather than shown.

This is the join, and the rules it follows.

## What is read, and from where

| Input | Source | Why there |
|---|---|---|
| Contributions | the contract: `sponsorship_count`, then `sponsorship(i)` | The wall names people who paid real money into a public pool. A list our database assembled is a list our database could be wrong about. |
| Prize positions | the frozen rules plus the bonuses on each position | A position is worth what the table froze plus every contribution since, and that is what the contract divides an undirected contribution by. |
| Payouts | the indexed `payments` log | A payment is a ledger fact the contract does not keep. The `sponsor_payouts` view adds the event's name beside it and nothing else. |

No table of ours holds a contribution, a share, or a total. Every figure a
receipt carries is one of those three sources, unchanged.

## The tracing rules

**A directed contribution** — the sponsor named a position — is traced to that
position, and from there to the vault's payments for it. This is the exact case
and the one a receipt cites a transaction for.

**An undirected contribution** — `rank: 0`, spread over a whole track — is
traced to every position in the track and says so. The contract divided it
between the positions when it landed, and the `Sponsorship` record keeps the
track, the amount and the fee **but not the split**, so a per position share
cannot be reconstructed. The trace reports the track's positions rather than
inventing one. That restraint is the whole point: a guess wearing the clothes of
evidence is worse than an acknowledged gap.

**The ending** comes from the payment rows for the position:

| `kind` | Route | Said as |
|---|---|---|
| `0` | `paid` | Paid to a winner |
| `1` | `swept` | Swept back after the claim period — the declared surplus route |
| `2` | `returned` | Returned because the track made no award — the declared refund route |
| no row | `unsettled` | Not paid yet |

`unsettled` is the event still running, not money that went nowhere, and it is
worded that way everywhere it appears. Where rows disagree the stronger
statement wins: money that reached a winner reads as paid even if a later row
swept a remainder.

## The one number that is deliberately missing

**What share of a payout was this sponsor's.** A position's payout is its frozen
prize plus every contribution to it, and no record separates one contribution
back out. So a receipt names the position's outcome and the position's whole
payout, labelled as the position's, and never implies a share. The database view
carries no such column either, and `backend/supabase/tests/sponsor-receipts.test.ts`
asserts it never will.

## What makes a receipt worth having

A receipt printed by the application a sponsor is being asked to trust is worth
exactly as much as the instructions for checking it elsewhere. So every receipt
carries the command that re-derives it from the contract and the payment log
with the SDK:

```ts
import { traceSponsorship, checkReceipt } from "@stelhacks/sdk";

const trace = traceSponsorship(record, places, payouts);
const problems = checkReceipt(receipt, { record, trace });
// an empty list means this receipt agrees with the chain's own records
```

`checkReceipt` reports a figure that does not reconcile, a transaction hash that
belongs to another position, **and** a hash the trace reached that the receipt
left out — a receipt that drops a payout is as misleading as one that invents
it.

## Two implementations on purpose

`sdk/src/sponsorship-trace.ts` and `frontend/lib/sponsors/trace.ts` hold the
same rule and neither imports the other. The web application does not depend on
the SDK package, and shipping it to a browser to trace a handful of records
would be the wrong trade; more importantly, a sponsor checking the claim has to
be able to derive the answer without this application in the way.

The agreement is written down in `fixtures/sponsors/` — `directed.json`,
`undirected.json`, `cancelled.json` — and three suites read it: the SDK's two
and `frontend/lib/sponsors/trace.test.ts`. A change on either side turns a suite
red and the file says which side moved. It is the same arrangement the contract
and the SDK already have for the ranking.

## Where it lives

| Layer | Path |
|---|---|
| The rule (SDK) | `sdk/src/sponsorship-trace.ts` |
| The rule (application) | `frontend/lib/sponsors/trace.ts` |
| Trace inputs from each source | `frontend/lib/sponsors/contributions.ts` |
| Receipts and the check command | `frontend/lib/sponsors/receipt.ts` |
| Route | `frontend/app/api/sponsor-receipts/route.ts` |
| Public page | `frontend/app/hackathons/[slug]/sponsors/` |
| Private dashboard | `frontend/app/sponsors/` — see `docs/sponsor-dashboard.md` |
| Payout view | `backend/supabase/migrations/20261121070000_sponsor_receipts_view.sql` |
| Shared fixtures | `fixtures/sponsors/` |

## Out of scope

Invoicing and tax documents, as the issue says. A receipt here is a statement of
what the chain recorded: no legal entity, no tax identity, no VAT line. Anything
that looked like an invoice would be a document somebody files, and this is a
document somebody checks.
