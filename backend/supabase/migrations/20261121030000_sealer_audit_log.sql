create table public.sealer_audit_entries (
  contract_id public.contract_address not null,
  sequence bigint not null check (sequence > 0),
  action text not null,
  outcome text not null check (outcome in ('accepted','rejected','revealed')),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  previous_hash text,
  recorded_at timestamptz not null,
  entry_hash text not null unique,
  primary key (contract_id, sequence)
);
create table public.sealer_audit_checkpoints (
  contract_id public.contract_address not null,
  sequence bigint not null,
  head text not null,
  signer public.stellar_address not null,
  signature text not null,
  created_at timestamptz not null,
  primary key (contract_id, sequence)
);
alter table public.sealer_audit_entries enable row level security;
alter table public.sealer_audit_checkpoints enable row level security;
grant select on public.sealer_audit_entries, public.sealer_audit_checkpoints to anon, authenticated;
grant select, insert on public.sealer_audit_entries, public.sealer_audit_checkpoints to service_role;
create policy "audit entries are public evidence" on public.sealer_audit_entries for select using (true);
create policy "audit checkpoints are public evidence" on public.sealer_audit_checkpoints for select using (true);
