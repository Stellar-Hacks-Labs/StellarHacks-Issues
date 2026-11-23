# Moderation

Anyone signed in can report a project page or a profile page. The category is one of spam, harassment, impersonation, illegal, or other. A reader can file three reports an hour.

The queue is at `/admin/moderation`. `GET /api/reports` returns 403 unless the caller is staff. A signed-out visitor is not staff.

A decision is hide, restore, or dismiss. It stores the actor, the time, and a reason. It does not update a project row and it does not update a result.
