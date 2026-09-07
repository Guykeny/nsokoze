-- ============================================================
-- Nsokoze — migration 002 : localisation + genres des salons
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

alter table salons add column if not exists ville varchar(80) not null default 'Bujumbura';
alter table salons add column if not exists lat double precision;
alter table salons add column if not exists lng double precision;

-- Clientèle servie par le salon : femme, homme (ou les deux)
alter table salons add column if not exists genres text[] not null default '{femme,homme}';
