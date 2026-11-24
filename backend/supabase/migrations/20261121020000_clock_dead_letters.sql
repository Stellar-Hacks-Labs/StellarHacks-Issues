create table public.clock_dead_letters (
  id bigint generated always as identity primary key,
  contract_id public.contract_address not null references public.hackathons(contract_id) on delete cascade,
  transition text not null,
  last_error text not null,
  transaction_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.clock_dead_letters enable row level security;
grant select on public.clock_dead_letters to authenticated;
grant select, insert, update on public.clock_dead_letters to service_role;
create policy "event organizers read clock dead letters"
  on public.clock_dead_letters for select to authenticated
  using (public.is_organizer(contract_id));
