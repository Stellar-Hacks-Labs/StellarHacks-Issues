-- The skills the filter offers on an empty board. Listings may name others.
create table public.team_board_skills (
  slug text primary key,
  label text not null
);

insert into public.team_board_skills (slug, label) values
  ('soroban', 'Soroban'),
  ('frontend', 'Frontend'),
  ('design', 'Design'),
  ('solidity', 'Solidity'),
  ('writing', 'Writing'),
  ('mobile', 'Mobile');
