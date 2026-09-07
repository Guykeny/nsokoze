-- ============================================================
-- Nsokoze — migration 004 : photos des salons (Supabase Storage)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Chemins des photos dans le bucket, dans l'ordre d'affichage
-- (la première est la photo principale).
alter table salons add column if not exists photos text[] not null default '{}';

-- Bucket public : les photos sont visibles par tous via URL publique
insert into storage.buckets (id, name, public)
values ('salon-photos', 'salon-photos', true)
on conflict (id) do nothing;

-- Lecture publique
create policy "photos salon lisibles par tous" on storage.objects
  for select using (bucket_id = 'salon-photos');

-- Chaque propriétaire écrit uniquement dans son dossier (= son user id)
create policy "proprietaire ajoute ses photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'salon-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "proprietaire supprime ses photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'salon-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
