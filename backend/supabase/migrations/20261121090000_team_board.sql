-- Listings sit beside team_requests. A request is still a row in
-- team_requests; this table only describes the open seat.
-- Reading requires a signed-in user. An anonymous select is denied.

create table public.team_listings (
  id uuid primary key default gen_random_uuid(),
  hackathon_id text not null,
  team_id integer not null,
  skills text[] not null default '{}',
  open_roles text[] not null default '{}',
  note text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (hackathon_id, team_id)
);

alter table public.team_listings enable row level security;

create policy team_listings_read on public.team_listings
  for select to authenticated
  using (true);

create policy team_listings_write on public.team_listings
  for insert to authenticated
  with check (created_by = auth.uid());

create policy team_listings_close on public.team_listings
  for update to authenticated
  using (created_by = auth.uid())
  with check (status in ('open', 'closed'));
