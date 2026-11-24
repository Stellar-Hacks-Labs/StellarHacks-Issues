create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_id public.contract_address not null,
  event_key text not null,
  type text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, event_key, type)
);
create table public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  enabled boolean not null default true,
  primary key (user_id, type)
);
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update on public.notifications, public.notification_preferences to service_role;
create policy "users read only their notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "users mark only their notifications" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users own notification preferences" on public.notification_preferences for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
