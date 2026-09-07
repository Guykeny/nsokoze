-- ============================================================
-- Nsokoze — migration 006 : activité et lieu d'exercice du salon
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Renseignés lors de l'inscription du gérant :
-- categorie : coiffure | esthetique | bien-etre
alter table salons add column if not exists categorie varchar(40);
alter table salons add column if not exists a_domicile boolean not null default false;
