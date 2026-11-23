-- Reports and the decisions taken on them.
-- A decision is a row. It does not update projects, profiles, or results.
-- The queue is selectable by platform staff only.

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('project', 'profile')),
  target_id text not null,
  category text not null check (category in ('spam', 'harassment', 'impersonation', 'illegal', 'other')),
  note text not null default '',
  reporter_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.content_reports (id),
  action text not null check (action in ('hide', 'restore', 'dismiss')),
  actor_id uuid not null,
  decided_at timestamptz not null default now(),
  reason text not null check (length(btrim(reason)) > 0)
);

alter table public.content_reports enable row level security;
alter table public.moderation_decisions enable row level security;

create policy reports_file on public.content_reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

create policy reports_staff_read on public.content_reports
  for select using (exists (select 1 from public.platform_staff s where s.id = auth.uid()));

create policy decisions_staff_read on public.moderation_decisions
  for select using (exists (select 1 from public.platform_staff s where s.id = auth.uid()));

create policy decisions_staff_write on public.moderation_decisions
  for insert with check (
    actor_id = auth.uid()
    and exists (select 1 from public.platform_staff s where s.id = auth.uid())
  );

create index content_reports_reporter_time on public.content_reports (reporter_id, created_at desc);
