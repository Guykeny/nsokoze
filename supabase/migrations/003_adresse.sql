-- ============================================================
-- Nsokoze — migration 003 : adresse textuelle du salon
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

alter table salons add column if not exists adresse varchar(200);
