-- Catalogue search. Visibility is decided in the function, not by the caller.
-- Public rows are readable by anyone. Restricted rows require a registration
-- recorded in search_registrations. Private rows require the owner or staff.
-- A generated tsvector keeps the index next to the row it describes.

create table public.search_documents (
  id text primary key,
  kind text not null check (kind in ('hackathon', 'project', 'builder')),
  title text not null,
  body text not null default '',
  phase text not null default '',
  prize_asset text not null default '',
  tags text[] not null default '{}',
  country text not null default '',
  hackathon_id text not null default '',
  owner_id uuid,
  visibility text not null check (visibility in ('public', 'restricted', 'private')),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'B')
  ) stored
);

create index search_documents_vector on public.search_documents using gin (search_vector);
create index search_documents_facets on public.search_documents (phase, prize_asset, country);

create table public.search_registrations (
  user_id uuid not null,
  hackathon_id text not null,
  primary key (user_id, hackathon_id)
);

alter table public.search_documents enable row level security;
alter table public.search_registrations enable row level security;

create policy search_documents_select on public.search_documents
  for select using (
    visibility = 'public'
    or owner_id = auth.uid()
    or exists (select 1 from public.platform_staff s where s.id = auth.uid())
    or (
      visibility = 'restricted'
      and exists (
        select 1 from public.search_registrations r
        where r.user_id = auth.uid() and r.hackathon_id = search_documents.hackathon_id
      )
    )
  );

create or replace function public.search_catalog(raw_query text)
returns setof public.search_documents
language sql
stable
security invoker
as $$
  select d.*
  from public.search_documents d
  where (
      raw_query is null
      or length(btrim(raw_query)) = 0
      or d.search_vector @@ websearch_to_tsquery('simple', raw_query)
    )
    and (
      d.visibility = 'public'
      or d.owner_id = auth.uid()
      or exists (select 1 from public.platform_staff s where s.id = auth.uid())
      or (
        d.visibility = 'restricted'
        and exists (
          select 1 from public.search_registrations r
          where r.user_id = auth.uid() and r.hackathon_id = d.hackathon_id
        )
      )
    );
$$;

grant execute on function public.search_catalog(text) to anon, authenticated;
