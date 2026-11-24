# Conflict declarations: the data

One table, six columns, and a policy per reader. This is the reference; the
reasoning is in `docs/conflicts-of-interest.md`.

## `public.conflict_declarations`

| Column | Type | Written by | Notes |
|---|---|---|---|
| `contract_id` | `public.contract_address` | the judge | The hackathon the declaration belongs to. Part of the key, so the same judge may be close to a team at one event and judge a differently numbered team at another. |
| `judge` | `public.stellar_address` | the judge | The address the frozen constitution named. Checked against `wallet_links`, so a judge can only write their own. |
| `team_id` | `integer` | the judge | The project, numbered as the contract numbers it. `> 0`. |
| `relationship` | `text` | the judge | One of `mentor`, `teammate`, `employer`, `investor`, `family`, `other`. Constrained in the column, because the queue filter and the proof page both read it. |
| `note` | `text` | the judge | Free text up to 500 characters. Required when the relationship is `other`. |
| `declared_at` | `timestamptz` | **the database** | `default now()`. Never sent by a client, and never rewritten by a correction. |
| `updated_at` | `timestamptz` | the database | Touched by `conflict_declarations_touch_updated_at`, so a correction is visible as one. |

Primary key: `(contract_id, judge, team_id)` — one declaration per judge per
project, correctable rather than duplicated. Index:
`conflict_declarations_by_event (contract_id, team_id)`, which is the organizer's
and the proof page's read.

## Who may do what

| Role | Select | Insert | Update | Delete |
|---|---|---|---|---|
| The judge the row is about | yes, always | yes, if the constitution named them a judge of that event | yes, their own row only | no |
| The event's organizer | yes, always | no | no | no |
| Platform staff | yes, always | no | no | no |
| Any other signed-in reader | only from phase 5 | no | no | no |
| A signed-out visitor | only from phase 5 | no | no | no |
| `service_role` (the sealer, the indexer) | yes | yes | yes | yes |

Phase 5 is the reveal, in the contract's own numbering. The public policy reads
`hackathon_state.phase`, which the indexer derives from chain events, so the
opening moment is the chain's and not an application's.

No client role has a delete grant. A declaration is permanent by construction.

## The policies, by name

| Policy | Rule |
|---|---|
| `a judge declares their own conflicts` | `insert` with `holds_address(judge) and is_judge(contract_id)` |
| `a judge corrects their own declaration` | `update` using `holds_address(judge)`, checking the same after the write, so the row cannot be handed to another judge |
| `a judge reads their own declarations` | `select` using `holds_address(judge)` |
| `event staff read the declarations for their event` | `select` using `is_organizer(contract_id) or is_staff()` |
| `a declaration is public from the reveal onwards` | `select` to `anon, authenticated` where the event's phase is at least 5 |

## How the sealer uses it

`backend/sealer/src/conflict-store.ts` reads the table with the service role,
because a card arrives while the declarations are still private. The read is per
submission and never cached: a judge who declares a conflict and stops scoring
seconds later would otherwise have the card accepted by a stale cache.

A failed read throws. The alternative — treating "the database did not answer"
as "no conflicts" — would accept a conflicted card at exactly the moment the
service cannot tell whether it should.

`backend/sealer/src/conflicts.ts` turns a declaration into the refusal:

```
POST /scorecard  →  409  { "error": "a conflict was declared for this project (mentor)" }
```

The judge console turns that sentence into "You declared a conflict with this
project, so your scorecard for it cannot be counted. The organizer reassigns
it." It matches on the wording, which is why the wording lives in
`conflicts.ts` beside the rule rather than inline at the route.

## How the frontend reads it

`frontend/lib/conflicts/read.ts` maps rows to declarations and **drops** any row
it cannot read — an unknown relationship, a team that arrived as text, an
unparseable time — counting them as `unreadable`. Both readers show that count.
Every reader of this list either hides a project from a judge or publishes a
claim about a named judge; showing less than the truth is recoverable, showing
something that is not the truth is not.

`publishable(phase, declarations)` is the page-side half of the reveal gate. The
database is the half that counts; this one exists so a page does not render a
section it would then have to apologise for, and so the reason is written where
a reader can see it.
