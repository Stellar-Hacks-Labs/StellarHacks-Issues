# Reviewer backlog

The AI pre-review queue is stuck or growing faster than it drains.

## Diagnose

```bash
cd backend/reviewer
npm run doctor
```

Expected: `all checks passed`. A missing `GITHUB_TOKEN` or `ANTHROPIC_API_KEY`
fails the env class and will leave requested runs waiting.

Confirm the process is running:

```bash
npm start
```

Expected: a lap every `REVIEWER_EVERY_MS` (default 60000) that either claims
work or reports an empty queue.

## Common causes

| Symptom | Likely cause | Action |
|---|---|---|
| Doctor fails on `GITHUB_TOKEN` | Token unset or empty | Set a fine-grained token with public-repo read |
| Runs start then stall on the twelfth project | Unauthenticated GitHub rate limit (60/hour) | Same as above |
| Doctor fails on `ANTHROPIC_API_KEY` | Key unset | Set the key; restart |
| Queue rows never leave `pending` | Process not running | Start the reviewer; check host logs |
| Deep reviews time out | Repository larger than `REVIEWER_DEEP_CHARS` | Expected: the review lists what did not fit |

## Drain a stuck run

Do not delete queue rows by hand unless the run is known abandoned. Prefer
restarting the reviewer so it resumes from durable state. If a row must be
cleared, record the project id and reason in the incident template first.
