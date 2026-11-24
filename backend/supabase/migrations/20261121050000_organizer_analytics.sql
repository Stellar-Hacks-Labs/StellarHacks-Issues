create view public.organizer_funnel with (security_barrier = true) as
select hs.contract_id,
  (select count(*) from public.chain_events e where e.contract_id = hs.contract_id and e.name = 'ApplicationDecided')::int as applications,
  (select count(*) from public.participants p where p.contract_id = hs.contract_id)::int as approved,
  (select count(*) from public.submissions s where s.contract_id = hs.contract_id)::int as submissions
from public.hackathon_state hs where public.is_organizer(hs.contract_id);

create view public.organizer_judge_progress with (security_barrier = true) as
select hs.contract_id,
  (cardinality(hs.judges) * (select count(*) from public.submissions s where s.contract_id = hs.contract_id))::int as expected,
  (select count(*) from public.scores s where s.contract_id = hs.contract_id)::int as completed
from public.hackathon_state hs where public.is_organizer(hs.contract_id);

create view public.organizer_vote_turnout with (security_barrier = true) as
select hs.contract_id,
  (select count(*) from public.participants p where p.contract_id = hs.contract_id)::int as eligible,
  (select count(*) from public.ballots b where b.contract_id = hs.contract_id)::int as ballots
from public.hackathon_state hs where public.is_organizer(hs.contract_id);

grant select on public.organizer_funnel, public.organizer_judge_progress, public.organizer_vote_turnout to authenticated;
