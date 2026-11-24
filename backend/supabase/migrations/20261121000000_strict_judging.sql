-- Strict-mode scorecard commitments, projected from chain events.
--
-- Easy mode never writes here: those scorecards live under seal with the
-- collection service until the reveal. Strict mode posts a digest per judge
-- per project during judging, and the disclose fills `scores` the same way a
-- sealed reveal does. Keeping the commitments in their own table means a
-- withheld disclose stays visible as a row that never gained a score.

create table public.scorecard_commitments (
  contract_id text not null,
  team_id integer not null,
  judge text not null,
  commitment bytea not null,
  committed_at_ledger bigint not null,
  disclosed_at_ledger bigint,
  primary key (contract_id, team_id, judge),
  constraint scorecard_commitments_team_positive check (team_id > 0),
  constraint scorecard_commitments_judge_shaped check (judge ~ '^G[A-Z2-7]{55}$'),
  constraint scorecard_commitments_digest_length check (octet_length(commitment) = 32)
);

comment on table public.scorecard_commitments is
  'Derived. Strict-mode commitments posted during judging; disclose fills scores.';

alter table public.scorecard_commitments enable row level security;

grant select on public.scorecard_commitments to anon, authenticated;
grant select, insert, update, delete on public.scorecard_commitments to service_role;

create policy scorecard_commitments_read
  on public.scorecard_commitments for select to anon, authenticated using (true);
