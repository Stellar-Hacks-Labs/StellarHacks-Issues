# Surplus routes

Undirected deposits beyond the prize table need a declared way out of the vault.
Every payout is otherwise tied to a prize position, and the vault has no
withdrawal function, so leftover money would sit there at closure.

The route is frozen in `SponsorshipPolicy.surplus` before the lock. Three
options exist:

| Route | What happens |
|:--|:--|
| `ProRata` | Leftover is spread across every payable position in proportion to what each already pays, as a bonus applied before the first settlement payout |
| `ReturnTo(Address)` | Leftover is paid to the named address once every position and the platform fee have cleared |
| `RollForward(Address)` | Same payment path as return, aimed at the vault of a named next hackathon instance |

Directed contributions (`sponsor_tier`, `sponsor_places`) are unaffected: they
raise a named position and settle with it. Only the undirected remainder — a
plain `deposit` that never named a tier — follows the surplus route.

`settle_surplus` walks the route. Pro rata is also applied automatically on the
first settlement payment so a top-up that arrives during the safety window still
reaches the table. `complete` refuses while the vault holds anything.
