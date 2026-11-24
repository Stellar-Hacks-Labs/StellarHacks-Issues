-- Gap records and consistency check results for the indexer.
--
-- Both tables are operational, not derived. They say what recovery found, not
-- what the chain said, and a client reading them would learn only that the
-- indexer had a bad day. Grants stop at service_role, matching the sealed
-- tables: no policy for anon or authenticated, so a mistaken grant later would
-- still refuse every row.

create table public.indexer_gaps (
  contract_id public.contract_address not null,
  from_ledger bigint not null,
  to_ledger bigint not null,
  reason text not null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,

  primary key (contract_id, from_ledger, to_ledger, reason),

  constraint indexer_gaps_range check (to_ledger >= from_ledger),
  constraint indexer_gaps_reason check (reason in ('missing_coverage', 'behind_retention'))
);

comment on table public.indexer_gaps is
  'Operational. Ledger ranges the indexer detected as unscanned; resolved when a re-ingest covers them.';

create index indexer_gaps_open on public.indexer_gaps (contract_id)
  where resolved_at is null;

create table public.indexer_consistency_checks (
  id uuid primary key default gen_random_uuid(),
  contract_id public.contract_address not null,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  mismatches jsonb not null default '[]'::jsonb
);

comment on table public.indexer_consistency_checks is
  'Operational. Append-only results of comparing projections with live contract state.';

create index indexer_consistency_checks_latest
  on public.indexer_consistency_checks (contract_id, checked_at desc);

alter table public.indexer_gaps enable row level security;
alter table public.indexer_consistency_checks enable row level security;

grant select, insert, update, delete on public.indexer_gaps to service_role;
grant select, insert, update, delete on public.indexer_consistency_checks to service_role;
