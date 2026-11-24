# The sponsor dashboard

Two pages, one set of figures, and a plain statement about which of them is
private.

## The public page: `/hackathons/[slug]/sponsors`

Every contribution the event took, beside what the vault paid along the position
it backed. Read with no account and no wallet, because a sponsor demonstrating
that funds were distributed as announced has to be able to send the link to
somebody who has never signed in here.

A name appears only where its owner asked for one and the organizer agreed —
`nameOf` in `lib/backers.ts` is the rule, reused rather than restated — and
everybody else is the address, which is what the chain actually knows.

It is a page rather than a tab on the event. A tab is a different question about
the event somebody is deciding whether to enter; this is a different reader
entirely, usually after the event, often being shown it by the sponsor. The tab
bar carries a link to it so it can be found, drawn as a link rather than as a
tab because following it leaves the page.

## The private page: `/sponsors`

The same figures, narrowed to the connected wallet, answering the question the
public page cannot answer at a glance: **of everything I gave, what is still
unpaid**.

"Private" is used carefully here. A contribution into a public vault and a
payment out of it are both public, and nothing on this page is hidden from
anybody who reads the event's sponsor page. What the dashboard does is ask about
one address — the connected one — and it says so on the page in those words. A
page that implied confidentiality it cannot provide would be making the first
claim a sponsor should distrust.

The event list is rendered on the server and the figures fill in from the
browser, one event at a time. Each answer is three contract reads deep, and a
server rendering twelve events would hold the whole page until the slowest
finished; a sponsor with one event should not wait for somebody else's twelve.

## What a sponsor sees per contribution

1. The track and the position backed, the prize given and the platform fee —
   kept apart, because the two go to different places.
2. One line per position the contribution reached, naming its ending in words
   (`Paid to a winner`, `Swept back after the claim period`, `Returned because
   the track made no award`, `Not paid yet`).
3. The position's whole payout and the transaction that produced it, labelled as
   the position's rather than as the sponsor's share — see
   `docs/sponsor-receipts.md` for why no share exists.
4. A receipt, folded away until asked for, with the command that re-derives it
   from the contract and the payment log using the SDK.

## When something cannot be read

Three sources, and each absence is said rather than shown as a zero:

| Unreachable | What the page says |
|---|---|
| The frozen rules | the prize positions are unknown, so contributions cannot be matched to positions |
| The contract's contribution list | nothing is shown, and the page says this is the chain out of reach rather than an event without sponsors |
| The payment log | outcomes read as "not paid yet", and the page says the log could not be read |

The alternative — an empty table — would quietly tell a sponsor their money went
nowhere, which is the worst thing this feature could do.

## Accessibility and shape

The public table is a real `<table>` with a caption that states what the
outcome column means and what it does not. The dashboard's receipts are folded
behind a button rather than printed inline: a sponsor backing twenty positions
has twenty receipts, and a page that printed all of them would bury the one
question they arrived with.
