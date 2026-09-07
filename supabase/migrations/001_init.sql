-- ============================================================
-- Nsokoze — réservation salons de beauté (Burundi)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

create extension if not exists btree_gist;

-- ---------- Tables ----------

create table salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  slug varchar(140) unique not null,
  phone varchar(20) not null,
  quartier varchar(80),
  description text,
  created_at timestamptz default now()
);

create table opening_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = dimanche
  opens_at time not null,
  closes_at time not null,
  check (closes_at > opens_at),
  unique (salon_id, weekday, opens_at)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name varchar(120) not null,
  duration_min smallint not null check (duration_min between 5 and 600),
  price_bif integer,
  is_active boolean default true
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  name varchar(120) not null,
  phone varchar(20) not null,
  notes text,
  created_at timestamptz default now(),
  unique (salon_id, phone)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references salons(id) on delete cascade,
  client_id uuid not null references clients(id),
  service_id uuid not null references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status varchar(20) not null default 'confirmed', -- confirmed | cancelled | no_show | done
  source varchar(20) not null default 'online',    -- online | manual
  created_at timestamptz default now(),
  check (ends_at > starts_at)
);

create index idx_appt_salon_day on appointments (salon_id, starts_at);

-- Deux RDV confirmés ne peuvent pas se chevaucher dans un même salon
alter table appointments add constraint no_overlap
  exclude using gist (
    salon_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed');

-- ---------- Row Level Security ----------

alter table salons enable row level security;
alter table opening_hours enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;

-- Lecture publique du catalogue
create policy "salons lisibles par tous" on salons
  for select using (true);
create policy "horaires lisibles par tous" on opening_hours
  for select using (true);
create policy "services lisibles par tous" on services
  for select using (true);

-- Le propriétaire gère son salon
create policy "creer son salon" on salons
  for insert with check (owner_id = auth.uid());
create policy "modifier son salon" on salons
  for update using (owner_id = auth.uid());

create policy "gerer ses horaires" on opening_hours
  for all using (
    exists (select 1 from salons s where s.id = salon_id and s.owner_id = auth.uid())
  );
create policy "gerer ses services" on services
  for all using (
    exists (select 1 from salons s where s.id = salon_id and s.owner_id = auth.uid())
  );
create policy "gerer ses clients" on clients
  for all using (
    exists (select 1 from salons s where s.id = salon_id and s.owner_id = auth.uid())
  );
create policy "gerer ses rdv" on appointments
  for all using (
    exists (select 1 from salons s where s.id = salon_id and s.owner_id = auth.uid())
  );
-- NB : aucune policy d'insertion pour anon sur appointments/clients.
-- La réservation publique passe uniquement par la fonction book_appointment.

-- ---------- Vue publique des créneaux occupés ----------
-- N'expose jamais les noms/téléphones des clients.

create view occupied_slots as
  select salon_id, starts_at, ends_at
  from appointments
  where status = 'confirmed';

grant select on occupied_slots to anon, authenticated;

-- ---------- Réservation en ligne (RPC) ----------

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
  v_service services%rowtype;
  v_ends_at timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_client_id uuid;
  v_appt_id uuid;
begin
  -- Nettoyage basique des entrées
  p_client_name  := trim(p_client_name);
  p_client_phone := regexp_replace(trim(p_client_phone), '[^0-9+]', '', 'g');

  if length(p_client_name) < 2 then
    raise exception 'nom_invalide';
  end if;
  if length(p_client_phone) < 7 then
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

  -- Crée ou retrouve le client
  insert into clients (salon_id, name, phone)
  values (p_salon_id, p_client_name, p_client_phone)
  on conflict (salon_id, phone)
  do update set name = excluded.name
  returning id into v_client_id;

  -- Insère le RDV ; la contrainte no_overlap protège contre les doubles réservations
  begin
    insert into appointments (salon_id, client_id, service_id, starts_at, ends_at, source)
    values (p_salon_id, v_client_id, p_service_id, p_starts_at, v_ends_at, 'online')
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

grant execute on function book_appointment to anon, authenticated;
