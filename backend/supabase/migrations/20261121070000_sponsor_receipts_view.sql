-- The payment side of a sponsor receipt, as one read instead of four.
--
-- A sponsor page asks the same question of every event it shows: what did the
-- vault pay, for which position, in which transaction. That is `payments`, and
-- `payments` is already readable by anybody — the rows are ledger facts about a
-- public vault. What it is not is convenient: the page needs the event's name
-- and slug beside them to say which hackathon a payout belongs to, and joining
-- three tables per event in the browser is three round trips to say one thing.
--
-- So this is a view and nothing more. No new permission, no column that was not
-- already public, no figure computed here:
--
--   * `payments` is selectable by `anon` and `authenticated` under its own
--     policy, and so are `hackathons` and `hackathon_state`.
--   * the view adds no aggregate and no derived amount. A share of a payout is
--     deliberately absent, because no record separates one sponsor's
--     contribution back out of a position's prize, and a column that implied
--     otherwise would be the one dishonest number this feature could print.
--   * the contributions themselves are **not** here. They are the contract's
--     and are read from it; a table of ours holding them would be a second
--     answer that could be wrong.
--
-- `security_invoker` so the view is read as the person asking rather than as
-- its owner. Without it a view over a row level secured table answers with the
-- owner's reach, which would make this the one way to read payments that the
-- policies do not govern.

create view public.sponsor_payouts
with (security_invoker = true)
as
select
  p.contract_id,
  h.slug,
  h.name as hackathon_name,
  s.prize_asset,
  p.track,
  p.rank,
  p.recipient,
  p.amount,
  -- 0 paid to a winner, 1 swept back after the claim period, 2 returned by a no
  -- award. Three different endings that must never be shown as one, so the raw
  -- value travels rather than a label this view invented.
  p.kind,
  p.ledger,
  p.tx_hash
from public.payments p
  left join public.hackathons h on h.contract_id = p.contract_id
  left join public.hackathon_state s on s.contract_id = p.contract_id;

comment on view public.sponsor_payouts is
  'Payments out of a prize vault with the event they belong to. A convenience over public rows: no new permission, no derived amount, and no sponsor share, which no record supports.';

grant select on public.sponsor_payouts to anon, authenticated, service_role;
