# Sponsor tracing fixtures

Three recorded shapes of "where did my contribution go", with the answer
written down beside the inputs.

## Why these are here rather than in a test file

The files in the directory above are single values two implementations must
agree on. These are one level up from that: whole scenarios, inputs and
expected outcome together, because the thing being pinned is a **rule** rather
than a digest — which payout a contribution is traced to, and what is said when
it cannot be traced exactly.

Three suites read them, and none of the three is measured against another.
`sdk/test/sponsorship-trace.test.ts` asserts the SDK reaches the recorded
outcome, and `sdk/test/sponsorship-trace-directed.test.ts` takes the directed
file further into the properties a receipt depends on.
`frontend/lib/sponsors/trace.test.ts` asserts the web application's own
implementation reaches the same answers — it cannot call the SDK, because the
frontend does not depend on that package and shipping it to a browser to trace
three records would be the wrong trade.

So the rule has two implementations on purpose, the way the contract and the
SDK do, and these files are what keep them honest: a change on either side
turns a suite red and the file says which side moved. The application's own
inputs, for everything that is about wiring rather than about the rule, are
built in TypeScript in `frontend/lib/sponsors/fixtures.ts`.

## The files

| File | The shape it pins |
|---|---|
| `directed.json` | Sponsors backing named positions in a track that paid them. The exactly traceable case, and the one a receipt cites a transaction for. |
| `undirected.json` | One contribution spread over a whole track, with a position still unpaid. The case the trace must **not** invent a per position share for. |
| `cancelled.json` | A no award return and a post claim sweep: the two endings that are not a winner. |

## The one rule worth reading before the code

A contribution aimed at a whole track (`rank: 0`) was divided between that
track's positions when it landed, and the `Sponsorship` record keeps the track,
the amount and the fee — not the split. So `undirected.json` expects a leg per
position, `directed: false`, and a note saying a per position share cannot be
reconstructed. Anything that claimed otherwise would be a guess wearing the
clothes of evidence, which is exactly what a sponsor receipt exists to avoid.

Amounts are strings because they are `i128` in the contract and exact here;
`worth` is the frozen prize plus every bonus, and `paidOut` is what the vault
actually sent along a leg — never this sponsor's own share of it, which no
record can separate out.
