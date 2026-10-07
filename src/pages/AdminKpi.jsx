import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { libelleCategorieBlog } from '../lib/categories.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { useMeta } from '../lib/useMeta.js'
import BarresJours from '../components/BarresJours.jsx'
import { dateLocale } from '../lib/temps.js'

export default function AdminKpi() {
  const nav = useNavigate()
  useMeta({ titre: 'Admin — KPI', noindex: true })
  const [statut, setStatut] = useState('verification') // verification | refuse | pret | erreur
  const [kpi, setKpi] = useState(null)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return nav('/compte')
      const { data, error } = await supabase.rpc('get_admin_kpis')
      if (error) {
        if (error.message.includes('acces_refuse')) {
          setStatut('refuse')
        } else {
          setErreur(error.message)
          setStatut('erreur')
        }
        return
      }
      setKpi(data)
      setStatut('pret')
    })
  }, [nav])

  if (statut === 'verification') {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />Vérification…</div>
        </div>
      </>
    )
  }

  if (statut === 'refuse') {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>Accès refusé</h1>
          <p className="sous-titre">Cette page est réservée aux administrateurs de Nsokoze.</p>
        </div>
      </>
    )
  }

  if (statut === 'erreur') {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>Tableau de bord</h1>
          <p className="erreur">
            {erreur?.includes('function') || erreur?.includes('does not exist')
              ? 'La base doit être mise à jour : exécutez la migration 010_admin_kpis.sql dans Supabase.'
              : 'Chargement impossible. ' + erreur}
          </p>
        </div>
      </>
    )
  }

  // Fonction SQL de la migration 010 (ancienne version) : champs absents
  if (!kpi.salons_incomplets) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>Tableau de bord</h1>
          <p className="erreur">
            La base doit être mise à jour : exécutez la migration 012_admin_kpis_v2.sql dans Supabase.
          </p>
        </div>
      </>
    )
  }

  const total = kpi.total_appointments

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 920 }}>
        <h1>Tableau de bord</h1>
        <p className="sous-titre">Vue d’ensemble de la plateforme Nsokoze.</p>

        {/* ---------- Synthèse ---------- */}
        <div className="stats-kpi">
          <div className="stat">
            <div className="val">{kpi.total_salons}</div>
            <div className="lib">{kpi.total_salons > 1 ? 'salons inscrits' : 'salon inscrit'}</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.salons_actifs}</div>
            <div className="lib">{kpi.salons_actifs > 1 ? 'salons actifs' : 'salon actif'}</div>
            <div className="detail">au moins 1 RDV sur 30 jours</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.total_clients}</div>
            <div className="lib">{kpi.total_clients > 1 ? 'clientes inscrites' : 'cliente inscrite'}</div>
          </div>
          <div className="stat">
            <div className="val">{total}</div>
            <div className="lib">rendez-vous au total</div>
            <div className="detail">dont {partie(kpi.appointments_online, total)} en ligne</div>
          </div>
        </div>

        {/* ---------- À faire ---------- */}
        <h2>À faire</h2>
        {kpi.salons_incomplets.length === 0 ? (
          <p className="kpi-phrase">Tous les salons ont des horaires, une prestation et une photo.</p>
        ) : (
          <>
            <p className="kpi-sous">
              Ces salons sont incomplets : sans horaires ni prestation, ils ne peuvent pas recevoir
              de réservation ; sans photo, ils attirent peu.
            </p>
            {kpi.salons_incomplets.map((s) => (
              <div key={s.id} className="carte a-faire">
                <span className="nom">{s.name}</span>
                <span className="manques">
                  {s.sans_horaires && <span className="manque">Aucun horaire</span>}
                  {s.sans_prestation && <span className="manque">Aucune prestation</span>}
                  {s.sans_photo && <span className="manque">Aucune photo</span>}
                </span>
                <Link to={`/s/${s.slug}`} className="btn-lien">Voir la page</Link>
              </div>
            ))}
          </>
        )}

        {/* ---------- Réservations ---------- */}
        <h2>Réservations</h2>
        <div className="stats-kpi">
          <div className="stat">
            <div className="val">{kpi.rdv_a_venir_7j}</div>
            <div className="lib">à venir cette semaine</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.rdv_honores}</div>
            <div className="lib">passés et honorés</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.rdv_annules_absents}</div>
            <div className="lib">annulés ou absents</div>
            {total > 0 && <div className="detail">{partie(kpi.rdv_annules_absents, total)}</div>}
          </div>
        </div>
        <div className="carte">
          <p className="kpi-sous" style={{ margin: '0 0 10px' }}>Prises par jour, 30 derniers jours</p>
          <BarresJours
            data={kpi.appointments_par_jour}
            libelle="Réservations prises par jour"
            vide="Aucune réservation prise ces 30 derniers jours."
          />
        </div>

        {/* ---------- Derniers inscrits ---------- */}
        <h2>Derniers inscrits</h2>
        {kpi.derniers_inscrits.length === 0 && (
          <p className="kpi-phrase">Aucune inscription pour l’instant.</p>
        )}
        {kpi.derniers_inscrits.map((u, i) => (
          <div key={i} className="carte ligne inscrit">
            <span className="nom">
              {u.slug ? <Link to={`/s/${u.slug}`}>{u.name}</Link> : u.name}
            </span>
            <span className="type">{u.type === 'salon' ? 'Salon' : 'Cliente'}</span>
            <span className="quand">{dateCourte(u.created_at)}</span>
          </div>
        ))}

        {/* ---------- Salons les plus actifs ---------- */}
        <h2>Salons les plus actifs</h2>
        {kpi.top_salons.length === 0 && (
          <p className="kpi-phrase">Aucune réservation enregistrée pour l’instant.</p>
        )}
        {kpi.top_salons.map((s, i) => (
          <div key={s.id} className="carte ligne classement-salon">
            <span className="rang">{i + 1}</span>
            <Link to={`/s/${s.slug}`} style={{ flex: 1 }}>{s.name}</Link>
            <span className="nb-rdv">{s.nb_appointments} RDV</span>
          </div>
        ))}

        {/* ---------- Blog ---------- */}
        <h2>Blog</h2>
        {kpi.articles_par_categorie.length === 0 ? (
          <p className="kpi-phrase">Aucun article publié pour l’instant.</p>
        ) : (
          <p className="kpi-phrase">
            {kpi.total_articles} {kpi.total_articles > 1 ? 'articles publiés' : 'article publié'} —{' '}
            {kpi.articles_par_categorie
              .map((a) => `${libelleCategorieBlog(a.categorie, 'fr')} : ${a.n}`)
              .join(' · ')}
          </p>
        )}

        <p style={{ marginTop: 24 }}>
          <Link to="/admin/blog" className="btn-lien">Administration du blog →</Link>
        </p>
      </div>
    </>
  )
}

/** « 1 sur 3 » tant que les volumes sont petits, pourcentage ensuite. */
function partie(n, total) {
  if (total === 0) return '0'
  if (total < 20) return `${n} sur ${total}`
  return `${Math.round((n / total) * 100)} %`
}

function dateCourte(iso) {
  return dateLocale(iso, 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
