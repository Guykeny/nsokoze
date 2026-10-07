-- ============================================================
-- Nsokoze — migration 011 : RDV rattachés au compte client,
-- annulation en ligne, avis, suppression de compte, temps réel.
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- ---------- RDV rattachés au compte qui a réservé ----------
alter table appointments
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_appt_user on appointments (user_id, starts_at desc);

-- Rattrapage : relie les anciens RDV en ligne au compte dont le profil
-- porte le même numéro (comparaison sur les chiffres uniquement).
update appointments a
set user_id = p.user_id
from clients c, profils p
where a.client_id = c.id
  and a.source = 'online'
  and a.user_id is null
  and regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(p.phone, '[^0-9]', '', 'g');

-- Une cliente lit ses propres RDV (services et salons sont déjà publics)
drop policy if exists "lire ses propres rdv" on appointments;
create policy "lire ses propres rdv" on appointments
  for select using (user_id = auth.uid());

-- ---------- Réservation (RPC) : version sécurisée ----------
-- Même signature qu'avant, deux cas :
--  * appelant = gérant du salon  → RDV manuel, nom/téléphone saisis par le salon ;
--  * appelant = cliente connectée → nom/téléphone lus dans SON profil
--    (les paramètres envoyés par le navigateur sont ignorés), RDV rattaché
--    à son compte, plafond de RDV à venir pour empêcher de bloquer un agenda.
create or replace function book_appointment(
  p_salon_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_phone text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_est_gerant boolean;
  v_service services%rowtype;
  v_ends_at timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_name text;
  v_phone text;
  v_client_id uuid;
  v_appt_id uuid;
begin
  if v_uid is null then
    raise exception 'connexion_requise';
  end if;

  v_est_gerant := exists (
    select 1 from salons where id = p_salon_id and owner_id = v_uid
  );

  if v_est_gerant then
    v_name  := trim(p_client_name);
    v_phone := p_client_phone;
  else
    select name, phone into v_name, v_phone from profils where user_id = v_uid;
    if not found then
      raise exception 'profil_incomplet';
    end if;

    -- Anti-blocage : 3 RDV à venir max dans un même salon, 10 au total
    if (select count(*) from appointments
        where user_id = v_uid and salon_id = p_salon_id
          and status = 'confirmed' and starts_at > now()) >= 3
       or
       (select count(*) from appointments
        where user_id = v_uid and status = 'confirmed' and starts_at > now()) >= 10
    then
      raise exception 'trop_de_rdv';
    end if;
  end if;

  v_name  := trim(v_name);
  v_phone := regexp_replace(trim(v_phone), '[^0-9+]', '', 'g');

  if length(v_name) < 2 then
    raise exception 'nom_invalide';
  end if;
  if length(v_phone) < 7 then
    raise exception 'telephone_invalide';
  end if;
  if p_starts_at <= now() then
    raise exception 'creneau_passe';
  end if;

  select * into v_service
  from services
  where id = p_service_id and salon_id = p_salon_id and is_active;
  if not found then
    raise exception 'service_introuvable';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_min);

  -- Vérifie les horaires d'ouverture (heure du Burundi)
  v_local_start := p_starts_at at time zone 'Africa/Bujumbura';
  v_local_end   := v_ends_at   at time zone 'Africa/Bujumbura';

  if not exists (
    select 1 from opening_hours
    where salon_id = p_salon_id
      and weekday = extract(dow from v_local_start)
      and v_local_start::time >= opens_at
      and v_local_end::time <= closes_at
  ) then
    raise exception 'hors_horaires';
  end if;

  -- Fiche client du salon. Seul le gérant peut renommer une fiche existante :
  -- une réservation en ligne ne doit pas écraser le nom saisi par le salon.
  if v_est_gerant then
    insert into clients (salon_id, name, phone)
    values (p_salon_id, v_name, v_phone)
    on conflict (salon_id, phone) do update set name = excluded.name
    returning id into v_client_id;
  else
    insert into clients (salon_id, name, phone)
    values (p_salon_id, v_name, v_phone)
    on conflict (salon_id, phone) do nothing
    returning id into v_client_id;
    if v_client_id is null then
      select id into v_client_id from clients
      where salon_id = p_salon_id and phone = v_phone;
    end if;
  end if;

  -- La contrainte no_overlap protège contre les doubles réservations
  begin
    insert into appointments
      (salon_id, client_id, service_id, starts_at, ends_at, source, user_id)
    values (
      p_salon_id, v_client_id, p_service_id, p_starts_at, v_ends_at,
      case when v_est_gerant then 'manual' else 'online' end,
      case when v_est_gerant then null else v_uid end
    )
    returning id into v_appt_id;
  exception when exclusion_violation then
    raise exception 'creneau_pris';
  end;

  return json_build_object(
    'appointment_id', v_appt_id,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at,
    'service', v_service.name
  );
end;
$$;

revoke execute on function book_appointment(uuid, uuid, timestamptz, text, text)
  from public, anon;
grant execute on function book_appointment(uuid, uuid, timestamptz, text, text)
  to authenticated;

-- ---------- Annulation par la cliente ----------
create or replace function cancel_my_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update appointments
  set status = 'cancelled'
  where id = p_appointment_id
    and user_id = auth.uid()
    and status = 'confirmed'
    -- au moins 2 h avant (DELAI_ANNULATION_H dans src/lib/config.js)
    and starts_at > now() + interval '2 hours';
  if not found then
    raise exception 'annulation_impossible';
  end if;
end;
$$;

revoke execute on function cancel_my_appointment(uuid) from public, anon;
grant execute on function cancel_my_appointment(uuid) to authenticated;

-- ---------- Avis clients ----------
create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique not null references appointments(id) on delete cascade,
  salon_id uuid not null references salons(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  auteur varchar(60) not null,       -- prénom affiché publiquement
  note smallint not null check (note between 1 and 5),
  commentaire text check (length(commentaire) <= 1000),
  created_at timestamptz default now()
);

create index if not exists idx_avis_salon on avis (salon_id, created_at desc);

alter table avis enable row level security;

-- La cliente voit ses propres avis ; le public passe par la vue avis_publics
drop policy if exists "lire ses avis" on avis;
create policy "lire ses avis" on avis
  for select using (user_id = auth.uid());

-- Vue publique : jamais le user_id ni le RDV
create or replace view avis_publics as
  select id, salon_id, auteur, note, commentaire, created_at from avis;
grant select on avis_publics to anon, authenticated;

create or replace view salon_notes as
  select salon_id, round(avg(note)::numeric, 1) as moyenne, count(*) as nb
  from avis group by salon_id;
grant select on salon_notes to anon, authenticated;

-- Un avis = un RDV passé de la cliente, non annulé, non « absente »
create or replace function laisser_avis(
  p_appointment_id uuid,
  p_note integer,
  p_commentaire text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appt appointments%rowtype;
  v_prenom text;
begin
  select * into v_appt from appointments
  where id = p_appointment_id
    and user_id = auth.uid()
    and status in ('confirmed', 'done')
    and ends_at < now();
  if not found then
    raise exception 'avis_impossible';
  end if;

  select split_part(trim(name), ' ', 1) into v_prenom
  from profils where user_id = auth.uid();

  insert into avis (appointment_id, salon_id, user_id, auteur, note, commentaire)
  values (
    p_appointment_id, v_appt.salon_id, auth.uid(),
    coalesce(nullif(v_prenom, ''), 'Cliente'),
    p_note, nullif(trim(p_commentaire), '')
  );
exception when unique_violation then
  raise exception 'avis_deja_donne';
end;
$$;

revoke execute on function laisser_avis(uuid, integer, text) from public, anon;
grant execute on function laisser_avis(uuid, integer, text) to authenticated;

-- ---------- Suppression ----------
drop policy if exists "supprimer son salon" on salons;
create policy "supprimer son salon" on salons
  for delete using (owner_id = auth.uid());

-- Supprime le compte connecté (profil, salon, avis : en cascade).
-- Les photos du bucket sont supprimées côté navigateur juste avant.
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'connexion_requise';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- ---------- Temps réel : l'agenda du salon reçoit les nouveaux RDV ----------
-- (les événements respectent les policies RLS : chaque salon ne voit que les siens)
do $$
begin
  alter publication supabase_realtime add table appointments;
exception when duplicate_object then null;
end $$;
