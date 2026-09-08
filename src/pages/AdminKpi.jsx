import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { libelleCategorieBlog } from '../lib/categories.js'
import SiteHeader from '../components/SiteHeader.jsx'
import Sparkline from '../components/Sparkline.jsx'

export default function AdminKpi() {
  const nav = useNavigate()
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

  const tauxAnnulation = kpi.total_appointments > 0
    ? Math.round(((kpi.appointments_cancelled + kpi.appointments_no_show) / kpi.total_appointments) * 100)
    : 0
  const partEnLigne = kpi.total_appointments > 0
    ? Math.round((kpi.appointments_online / kpi.total_appointments) * 100)
    : 0

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 920 }}>
        <h1>Tableau de bord</h1>
        <p className="sous-titre">Vue d’ensemble de la plateforme Nsokoze.</p>

        {/* ---------- Tuiles de synthèse ---------- */}
        <div className="stats-kpi">
          <div className="stat">
            <div className="val">{kpi.total_clients}</div>
            <div className="lib">clientes inscrites</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.total_salons}</div>
            <div className="lib">salons inscrits</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.total_appointments}</div>
            <div className="lib">rendez-vous au total</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.total_articles}</div>
            <div className="lib">articles publiés</div>
          </div>
        </div>

        {/* ---------- Croissance ---------- */}
        <h2>Nouvelles clientes (30 derniers jours)</h2>
        <div className="carte">
          <Sparkline data={kpi.clients_par_jour} couleur="var(--noir)" />
        </div>

        <h2>Nouveaux salons (30 derniers jours)</h2>
        <div className="carte">
          <Sparkline data={kpi.salons_par_jour} couleur="var(--or-fonce)" />
        </div>

        {/* ---------- Activité des réservations ---------- */}
        <h2>Activité des réservations</h2>
        <div className="stats-kpi">
          <div className="stat">
            <div className="val">{partEnLigne}%</div>
            <div className="lib">réservées en ligne</div>
          </div>
          <div className="stat">
            <div className="val">{kpi.appointments_done}</div>
            <div className="lib">rendez-vous honorés</div>
          </div>
          <div className="stat">
            <div className="val">{tauxAnnulation}%</div>
            <div className="lib">annulés ou absents</div>
          </div>
        </div>
        <div className="carte">
          <Sparkline data={kpi.appointments_par_jour} couleur="var(--vert)" />
        </div>

        {/* ---------- Salons les plus actifs ---------- */}
        <h2>Salons les plus actifs</h2>
        {kpi.top_salons.length === 0 && (
          <div className="vide">Aucune réservation enregistrée pour l’instant.</div>
        )}
        {kpi.top_salons.map((s, i) => (
          <div key={s.id} className="carte ligne classement-salon">
            <span className="rang">{i + 1}</span>
            <Link to={`/s/${s.slug}`} style={{ flex: 1 }}>{s.name}</Link>
            <span className="nb-rdv">{s.nb_appointments} RDV</span>
          </div>
        ))}

        {/* ---------- Blog par catégorie ---------- */}
        <h2>Articles publiés par catégorie</h2>
        {kpi.articles_par_categorie.length === 0 && (
          <div className="vide">Aucun article publié pour l’instant.</div>
        )}
        {kpi.articles_par_categorie.map((a) => (
          <div key={a.categorie} className="carte ligne">
            <span style={{ flex: 1 }}>{libelleCategorieBlog(a.categorie, 'fr')}</span>
            <span className="nb-rdv">{a.n}</span>
          </div>
        ))}

        <p style={{ marginTop: 24 }}>
          <Link to="/admin/blog" className="btn-lien">Administration du blog →</Link>
        </p>
      </div>
    </>
  )
}
