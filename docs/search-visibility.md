# Search visibility

`docs/decisions.md` section 5 defines three levels.

- `public` is readable by anyone, including a signed-out visitor.
- `restricted` is readable by someone registered for that hackathon, by the owner, and by platform staff.
- `private` is readable by the owner and by platform staff.

A row the reader cannot see is removed before text matching and before facet counts. It cannot be reached by guessing its id through this search. The row-level policy on `search_documents` repeats the same rule, so a direct select is held to it as well.

Registration is a row in `search_registrations`. The search function does not take a staff flag from the client. Staff is `platform_staff`.
