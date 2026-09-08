-- ============================================================
-- Nsokoze — migration 010 : tableau de bord KPI (admin)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- ============================================================

-- Toutes les statistiques sont calculées côté serveur, en une seule
-- fonction, pour ne jamais exposer les tables clients/appointments/
-- profils brutes à l'admin (elles gardent leurs policies RLS
-- normales — seule cette fonction, en security definer, peut tout lire).
create or replace function get_admin_kpis()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  -- Réservé aux comptes présents dans la table admins
  if not exists (select 1 from admins where user_id = auth.uid()) then
    raise exception 'acces_refuse';
  end if;

  select json_build_object(
    -- ---------- Totaux ----------
    'total_clients', (select count(*) from profils),
    'total_salons', (select count(*) from salons),
    'total_appointments', (select count(*) from appointments),
    'total_articles', (select count(*) from articles where publie = true),

    -- ---------- Réservations par source / statut ----------
    'appointments_online', (select count(*) from appointments where source = 'online'),
    'appointments_manual', (select count(*) from appointments where source = 'manual'),
    'appointments_cancelled', (select count(*) from appointments where status = 'cancelled'),
    'appointments_no_show', (select count(*) from appointments where status = 'no_show'),
    'appointments_done', (select count(*) from appointments where status = 'done'),

    -- ---------- Évolution : nouveaux clients par jour (30 derniers jours) ----------
    'clients_par_jour', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select
          to_char(d.jour, 'YYYY-MM-DD') as jour,
          coalesce(c.n, 0) as n
        from generate_series(
          current_date - interval '29 days', current_date, interval '1 day'
        ) as d(jour)
        left join (
          select created_at::date as jour, count(*) as n
          from profils
          where created_at >= current_date - interval '29 days'
          group by created_at::date
        ) c on c.jour = d.jour::date
        order by d.jour
      ) t
    ),

    -- ---------- Évolution : nouveaux salons par jour (30 derniers jours) ----------
    'salons_par_jour', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select
          to_char(d.jour, 'YYYY-MM-DD') as jour,
          coalesce(s.n, 0) as n
        from generate_series(
          current_date - interval '29 days', current_date, interval '1 day'
        ) as d(jour)
        left join (
          select created_at::date as jour, count(*) as n
          from salons
          where created_at >= current_date - interval '29 days'
          group by created_at::date
        ) s on s.jour = d.jour::date
        order by d.jour
      ) t
    ),

    -- ---------- Évolution : réservations par jour (30 derniers jours) ----------
    'appointments_par_jour', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select
          to_char(d.jour, 'YYYY-MM-DD') as jour,
          coalesce(a.n, 0) as n
        from generate_series(
          current_date - interval '29 days', current_date, interval '1 day'
        ) as d(jour)
        left join (
          select created_at::date as jour, count(*) as n
          from appointments
          where created_at >= current_date - interval '29 days'
          group by created_at::date
        ) a on a.jour = d.jour::date
        order by d.jour
      ) t
    ),

    -- ---------- Salons les plus actifs (top 10 par nb de RDV) ----------
    'top_salons', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select
          s.id,
          s.name,
          s.slug,
          count(a.id) as nb_appointments
        from salons s
        left join appointments a on a.salon_id = s.id
        group by s.id, s.name, s.slug
        order by nb_appointments desc, s.created_at asc
        limit 10
      ) t
    ),

    -- ---------- Blog par catégorie ----------
    'articles_par_categorie', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
        select categorie, count(*) as n
        from articles
        where publie = true
        group by categorie
        order by n desc
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function get_admin_kpis to authenticated;
