-- What a judge says about the teams they are close to, before they score any of
-- them.
--
-- A judge who mentored a team is not a scandal; a judge who mentored a team and
-- scored it without saying so is. The product cannot detect the relationship
-- and should not try: it can only make saying so cheap, make the declaration
-- permanent, and refuse the card that contradicts it.
--
-- Three readers, three different moments:
--
--   the judge        their own declarations, always, so the console can show
--                    what they have already said
--   the organizer    every declaration for their event, during judging, because
--                    they are the one who has to reassign a project
--   everybody        after the reveal, on the proof page, next to the scores
--                    the declarations bound
--
-- The public wait is the only one that needs explaining. Before the reveal the
-- scores are sealed and the panel is still working; publishing who declared
-- what while they score tells a team which judge is left to mark them. After
-- the reveal the scores are open, and a declaration is only useful at that
-- point: it is what lets a reader check that the judge who scored them was not
-- the judge who mentored them.

create table public.conflict_declarations (
  contract_id public.contract_address not null,
  judge public.stellar_address not null,
  team_id integer not null,

  -- The relationship, from a fixed list rather than as free text.
  --
  -- A list can be read by the queue filter, counted on the proof page and
  -- translated; a sentence can only be displayed. The note beside it carries
  -- whatever the list cannot.
  relationship text not null check (
    relationship in ('mentor', 'teammate', 'employer', 'investor', 'family', 'other')
  ),
  note text not null default '',

  -- When the judge said it, which is the whole point of recording it at all: a
  -- declaration that arrived after the scores would prove nothing.
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (contract_id, judge, team_id),
  constraint conflict_declarations_team_id_positive check (team_id > 0),
  constraint conflict_declarations_note_length check (char_length(note) <= 500)
);

comment on table public.conflict_declarations is
  'A judge''s own statement that they are close to a team. Public after the reveal; it blocks their scorecard for that team from the moment it exists.';

comment on column public.conflict_declarations.declared_at is
  'When the judge declared. Never rewritten by an edit, so a late declaration cannot be made to look early.';

create trigger conflict_declarations_touch_updated_at
  before update on public.conflict_declarations
  for each row execute function public.touch_updated_at();

create index conflict_declarations_by_event
  on public.conflict_declarations (contract_id, team_id);

-- Who may read and write it ----------------------------------------------------

alter table public.conflict_declarations enable row level security;

grant select on public.conflict_declarations to anon;
grant select, insert, update on public.conflict_declarations to authenticated;
grant select, insert, update, delete on public.conflict_declarations to service_role;

-- Written by the judge the declaration is about, and by nobody else. The check
-- is on the row rather than on the session, so a judge who sends another
-- judge's address is refused by the same rule that lets them write their own.
create policy "a judge declares their own conflicts"
  on public.conflict_declarations for insert to authenticated
  with check (public.holds_address(judge) and public.is_judge(contract_id));

-- A correction is allowed; a transfer is not. `using` decides which rows the
-- judge may touch and `with check` decides what they may leave behind, so
-- changing `judge` to somebody else fails even though the row started as
-- theirs.
create policy "a judge corrects their own declaration"
  on public.conflict_declarations for update to authenticated
  using (public.holds_address(judge))
  with check (public.holds_address(judge) and public.is_judge(contract_id));

create policy "a judge reads their own declarations"
  on public.conflict_declarations for select to authenticated
  using (public.holds_address(judge));

create policy "event staff read the declarations for their event"
  on public.conflict_declarations for select to authenticated
  using (public.is_organizer(contract_id) or public.is_staff());

-- Phase five is the reveal. Comparing against the phase the indexer recorded
-- rather than against a flag somebody sets means the declarations open at
-- exactly the moment the scores do, and neither we nor the organizer can open
-- them earlier.
create policy "a declaration is public from the reveal onwards"
  on public.conflict_declarations for select to anon, authenticated
  using (
    exists (
      select 1
      from public.hackathon_state h
      where h.contract_id = conflict_declarations.contract_id
        and h.phase >= 5
    )
  );
