# Conflicts of interest

A judge who mentored a team is not a scandal. A judge who mentored a team and
scored it without saying so is, and until now a participant had no way to tell
the two apart.

This is what the platform does about it, and — just as important — what it
deliberately does not.

## The policy

1. **A judge declares.** Before the scoresheets appear, the judge console lists
   every project and asks which teams the judge is close to. Declaring takes one
   click and a relationship from a fixed list; the note beside it carries
   whatever the list cannot.
2. **The declaration is recorded with its time.** `declared_at` is the
   database's own default and is never sent by the client, so a declaration made
   after the scores cannot be made to look as though it came first. A correction
   keeps the original time.
3. **The project leaves that judge's queue.** The console sets it aside, and the
   sealed collection service refuses a scorecard from that judge for that
   project with a `409`. The second half is the one that counts: a card can
   arrive from anywhere, and the page that hid the project was never in the way.
4. **The organizer sees it during judging.** The Conflicts tab on the manage
   panel groups declarations by project, because the organizer's question is
   "which project is now a card short" and the answer decides whether they ask
   another judge.
5. **Everybody sees it at the reveal.** The proof page publishes every
   declaration beside the scores it bound: the judge, the project, the
   relationship and the time.

## Why the public wait

Before the reveal the scores are sealed and the panel is still working. A public
list of who declared what at that moment tells a team which judges are left to
mark them, which is an invitation to lobby exactly the people who can still be
lobbied. After the reveal the scores are open and the declarations become what
they are for: the evidence a team needs to check that the judge who marked them
was not the judge who mentored them.

The wait is enforced by row level security against the phase the indexer
recorded, not by the page. Neither we nor the organizer can open them early.

## What this does not do

- **It does not detect anything.** Nobody here knows who mentored whom.
  Automatic detection — guessing at relationships from shared repositories,
  employers or social graphs — is out of scope, and not only for effort: a guess
  about somebody's relationships, published next to their name, would be worse
  than the gap it filled.
- **It does not prove that every conflict was declared.** It proves that the
  question was put before the work, and that each declaration made was recorded
  before the scores opened and blocked that judge's card. The proof page says
  exactly that, in those words.
- **It does not let anybody take a declaration back.** There is no delete policy
  for any client role. A judge can correct the relationship and the note; the
  row, and its time, stay. A record that can be removed after the fact is not a
  record.
- **It does not overrule a judge.** An organizer cannot clear a declaration,
  because an organizer who could clear one could clear the evidence of it. What
  they can do is reassign the project.
- **It does not reach the chain.** The constitution names the judges and the
  contract verifies a Merkle proof at the reveal; it knows nothing about
  declarations. A conflicted card that somehow reached the tree would still be
  counted by the contract, which is why the refusal is at the one service that
  builds the tree.

## The limits a reader should know

- A judge who declares nothing has declared nothing. That is a statement, and
  the proof page reads it as one, but it is not a check.
- The relationship list is six words long and will never describe everybody's
  situation. `other` plus a required note is the pressure valve.
- A declaration is per project. A judge close to an entire cohort declares each
  project, and a judge who declares every project has said they cannot score the
  event — the console says so rather than showing them an empty sheet.
- Scorecards sealed before a declaration existed are already in the service's
  hands. The declaration blocks cards from the moment it exists; it does not
  reach back. An organizer who needs an earlier card excluded has the
  disqualification and appeal paths the constitution already bounds.

## Where it lives

| Layer | Path |
|---|---|
| Table and policies | `backend/supabase/migrations/20261121060000_conflict_declarations.sql` |
| Role tests | `backend/supabase/tests/conflicts.test.ts`, `conflicts-reveal.test.ts` |
| The refusal | `backend/sealer/src/conflicts.ts`, `conflict-store.ts`, wired in `routes.ts` |
| Judge console | `frontend/app/judge/[contract]/declare.tsx`, `declare-confirm.tsx`, `conflict-list.tsx` |
| Reading and filtering | `frontend/lib/conflicts/` |
| Route | `frontend/app/api/conflicts/route.ts` |
| Organizer view | `frontend/app/manage/[contract]/conflicts.tsx` |
| Public view | `frontend/app/hackathons/[slug]/proof/conflicts.tsx` |

The data itself — every column, who may read it when, and what each value means
— is in `docs/conflicts-of-interest-data.md`.
