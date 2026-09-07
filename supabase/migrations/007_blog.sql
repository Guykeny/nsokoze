-- ============================================================
-- Nsokoze — migration 007 : blog + administrateurs
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- ---------- Administrateurs ----------
-- Table séparée (impossible d'ajouter une colonne à auth.users) :
-- une ligne = un compte autorisé à gérer le blog.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table admins enable row level security;

-- Un utilisateur peut seulement vérifier s'IL est admin (pas la liste entière)
create policy "lire son propre statut admin" on admins
  for select using (user_id = auth.uid());

-- ---------- Articles ----------
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug varchar(160) unique not null,
  categorie varchar(20) not null default 'conseils',
    -- conseils | actualites | salons
  titre varchar(200) not null,
  titre_en varchar(200),
  extrait text,
  extrait_en text,
  contenu text not null,       -- paragraphes séparés par \n\n
  contenu_en text,
  image text,                  -- chemin dans le bucket blog-photos
  publie boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_articles_publie on articles (publie, created_at desc);

alter table articles enable row level security;

-- Lecture publique des seuls articles publiés
create policy "articles publies lisibles par tous" on articles
  for select using (publie = true);

-- Un admin voit tout (y compris les brouillons) et gère tout
create policy "admin lit tous les articles" on articles
  for select using (exists (select 1 from admins where user_id = auth.uid()));
create policy "admin cree des articles" on articles
  for insert with check (exists (select 1 from admins where user_id = auth.uid()));
create policy "admin modifie les articles" on articles
  for update using (exists (select 1 from admins where user_id = auth.uid()));
create policy "admin supprime les articles" on articles
  for delete using (exists (select 1 from admins where user_id = auth.uid()));

-- ---------- Stockage des images d'articles ----------
insert into storage.buckets (id, name, public)
values ('blog-photos', 'blog-photos', true)
on conflict (id) do nothing;

create policy "photos blog lisibles par tous" on storage.objects
  for select using (bucket_id = 'blog-photos');

create policy "admin ajoute des photos blog" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'blog-photos'
    and exists (select 1 from admins where user_id = auth.uid())
  );

create policy "admin supprime des photos blog" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'blog-photos'
    and exists (select 1 from admins where user_id = auth.uid())
  );

-- ---------- Vous rendre administrateur ----------
-- Remplacez l'email ci-dessous par le vôtre puis exécutez cette ligne
-- (à faire une fois, séparément, après avoir créé votre compte) :
--
-- insert into admins (user_id)
-- select id from auth.users where email = 'votre-email@exemple.com';
