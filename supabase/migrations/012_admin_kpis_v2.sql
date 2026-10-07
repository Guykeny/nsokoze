-- ============================================================
-- Nsokoze — migration 012 : tableau de bord admin, version 2
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
--
-- Remplace get_admin_kpis (migration 010) :
--  * dates calculées à l'heure de Bujumbura ;
--  * clientes = profils qui ne sont pas gérants d'un salon ;
--  * salons actifs (≥ 1 RDV sur 30 jours) ;
--  * RDV honorés = passés et ni annulés ni absents (les salons ne
--    marquent presque jamais « terminé » à la main) ;
--  * blocs actionnables : salons incomplets, derniers inscrits.
-- ============================================================

create or replace function get_admin_kpis()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aujourdhui date := (now() at time zone 'Africa/Bujumbura')::date;
  v_result json;
begin
  if not exists (select 1 from admins where user_id = auth.uid()) then
    raise exception 'acces_refuse';
  end if;

  select json_build_object(
    -- ---------- Synthèse ----------
    'total_salons', (select count(*) from salons),
    'salons_actifs', (
      select count(distinct salon_id) from appointments
      where starts_at >= now() - interval '30 days'
    ),
    'total_clients', (
      select count(*) from profils p
      where not exists (select 1 from salons s where s.owner_id = p.user_id)
    ),
    'total_appointments', (select count(*) from appointments),
    'total_articles', (select count(*) from articles where publie = true),

    -- ---------- Réservations ----------
    'appointments_online', (select count(*) from appointments where source = 'online'),
    'rdv_a_venir_7j', (
      select count(*) from appointments
      where status = 'confirmed'
        and starts_at between now() and now() + interval '7 days'
    ),
    'rdv_honores', (
      select count(*) from appointments
      where starts_at < now() and status in ('confirmed', 'done')
    ),
    'rdv_annules_absents', (
      select count(*) from appointments where status in ('cancelled', 'no_show')
    ),

    -- Réservations prises par jour (date de prise, heure de Bujumbura)
    'appointments_par_jour', (
      select coalesce(json_agg(row_to_json(t) order by t.jour), '[]'::json) from (
        select
          to_char(d.jour, 'YYYY-MM-DD') as jour,
          coalesce(a.n, 0) as n
        from generate_series(v_aujourdhui - 29, v_aujourdhui, interval '1 day') as d(jour)
        left join (
          select (created_at at time zone 'Africa/Bujumbura')::date as jour, count(*) as n
          from appointments
          where created_at >= now() - interval '31 days'
          group by 1
        ) a on a.jour = d.jour::date
      ) t
    ),

    -- ---------- À faire : salons qui ne peuvent pas (bien) recevoir ----------
    'salons_incomplets', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select
          s.id, s.name, s.slug,
          not exists (select 1 from opening_hours h where h.salon_id = s.id) as sans_horaires,
          not exists (select 1 from services v where v.salon_id = s.id and v.is_active) as sans_prestation,
          coalesce(cardinality(s.photos), 0) = 0 as sans_photo
        from salons s
        where not exists (select 1 from opening_hours h where h.salon_id = s.id)
           or not exists (select 1 from services v where v.salon_id = s.id and v.is_active)
           or coalesce(cardinality(s.photos), 0) = 0
        order by s.created_at desc
      ) t
    ),

    -- ---------- Derniers inscrits (salons et clientes) ----------
    'derniers_inscrits', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select * from (
          select name, 'salon' as type, slug, created_at from salons
          union all
          select p.name, 'cliente' as type, null as slug, p.created_at from profils p
          where not exists (select 1 from salons s where s.owner_id = p.user_id)
        ) u
        order by created_at desc
        limit 8
      ) t
    ),

    -- ---------- Salons les plus actifs ----------
    'top_salons', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select s.id, s.name, s.slug, count(a.id) as nb_appointments
        from salons s
        join appointments a on a.salon_id = s.id
        group by s.id, s.name, s.slug
        order by nb_appointments desc, s.name
        limit 10
      ) t
    ),

    -- ---------- Blog ----------
    'articles_par_categorie', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select categorie, count(*) as n
        from articles where publie = true
        group by categorie order by n desc
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function get_admin_kpis to authenticated;
