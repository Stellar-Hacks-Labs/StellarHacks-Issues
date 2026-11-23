# Teammate board

A listing names the skills a team wants and the roles that are open. It is not a team. Joining is still a request in `team_requests`, filed with `askToJoin`, and the chain still requires both signatures.

A reader who is not signed in gets 401 from `GET /api/team-board` and an empty board on the page, with a sentence that says why.

`closeFilled` marks a listing closed when `hasRoom` is false for that team at the constitution's maximum size. A closed listing is not offered as a new request.

The score in `match.ts` is the number of shared skills. It orders cards. It never writes a membership.
