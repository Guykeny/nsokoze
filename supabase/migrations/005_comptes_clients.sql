-- ============================================================
-- Nsokoze — migration 005 : comptes clients obligatoires
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Profil d'un client (nom + téléphone rattachés à son compte)
create table if not exists profils (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name varchar(120) not null,
  phone varchar(20) not null,
  created_at timestamptz default now()
);

alter table profils enable row level security;

create policy "lire son profil" on profils
  for select using (user_id = auth.uid());
create policy "creer son profil" on profils
  for insert with check (user_id = auth.uid());
create policy "modifier son profil" on profils
  for update using (user_id = auth.uid());

-- La réservation exige désormais un compte connecté :
-- les visiteurs anonymes peuvent consulter, mais plus réserver.
revoke execute on function book_appointment(uuid, uuid, timestamptz, text, text)
  from public, anon;
grant execute on function book_appointment(uuid, uuid, timestamptz, text, text)
  to authenticated;
