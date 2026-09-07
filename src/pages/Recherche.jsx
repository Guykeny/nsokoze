import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, computeSlots, formatBif, formatTime, photoUrl } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import { CarteSalons } from '../components/Carte.jsx'

const PHOTOS_SALONS = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=60',
]

const NB_JOURS_DISPO = 3 // pastilles matin / après-midi affichées
const HORIZON_JOURS = 7  // recherche du prochain créneau libre

function normaliser(t) {
  return (t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Mots trop génériques pour éliminer un salon : tous nos salons font de la
// coiffure/beauté, donc « coiffure » ou « salon » ne doivent rien exclure.
const MOTS_GENERIQUES = new Set([
  'coiffure', 'coiffeur', 'coiffeurs', 'coiffeuse', 'salon', 'salons',
  'beaute', 'institut', 'instituts', 'de', 'du', 'la', 'le', 'les', 'a', 'au', 'chez',
])

function dateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export default function Recherche() {
  const nav = useNavigate()
  const { t, locale } = useLang()

  function labelJour(offset) {
    if (offset === 0) return t('r_auj')
    if (offset === 1) return t('r_demain')
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })
  }
  const [params, setParams] = useSearchParams()
  const [salons, setSalons] = useState([])
  const [prestations, setPrestations] = useState({}) // salon_id -> [{name, duration_min, price_bif}]
  const [heures, setHeures] = useState([])           // opening_hours de tous les salons
  const [occupes, setOccupes] = useState([])         // créneaux pris sur l'horizon
  const [loading, setLoading] = useState(true)
  const [voirCarte, setVoirCarte] = useState(false)
  const [deplies, setDeplies] = useState(() => new Set())

  const [q, setQ] = useState(params.get('q') ?? '')
  const [ou, setOu] = useState(params.get('ou') ?? '')
  const genre = params.get('genre') // 'femme' | 'homme' | null

  useEffect(() => {
    const debut = new Date(`${dateStr(0)}T00:00`).toISOString()
    const fin = new Date(`${dateStr(HORIZON_JOURS)}T23:59:59`).toISOString()
    Promise.all([
      supabase.from('salons').select('*').order('created_at'),
      supabase.from('services').select('salon_id, name, duration_min, price_bif').eq('is_active', true),
      supabase.from('opening_hours').select('salon_id, weekday, opens_at, closes_at'),
      supabase.from('occupied_slots').select('salon_id, starts_at, ends_at')
        .gte('starts_at', debut).lte('starts_at', fin),
    ]).then(([{ data: sal }, { data: svc }, { data: hrs }, { data: occ }]) => {
      setSalons(sal ?? [])
      const parSalon = {}
      for (const s of svc ?? []) {
        ;(parSalon[s.salon_id] ??= []).push(s)
      }
      setPrestations(parSalon)
      setHeures(hrs ?? [])
      setOccupes(occ ?? [])
      setLoading(false)
    })
  }, [])

  function appliquer(e) {
    e?.preventDefault()
    const next = {}
    if (q.trim()) next.q = q.trim()
    if (ou.trim()) next.ou = ou.trim()
    if (genre) next.genre = genre
    setParams(next)
  }

  function basculeGenre(g) {
    const next = {}
    if (params.get('q')) next.q = params.get('q')
    if (params.get('ou')) next.ou = params.get('ou')
    if (genre !== g) next.genre = g
    setParams(next)
  }

  function basculeDetails(id) {
    setDeplies((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Disponibilités par salon : prochain créneau + matin/après-midi sur 3 jours
  const dispos = useMemo(() => {
    const parSalon = {}
    for (const s of salons) {
      const svc = prestations[s.id] ?? []
      const dureeMin = svc.length
        ? Math.min(...svc.map((x) => x.duration_min || 60))
        : 60
      const mesHeures = heures.filter((h) => h.salon_id === s.id)
      const mesOccupes = occupes.filter((o) => o.salon_id === s.id)

      let prochain = null
      const jours = []
      for (let offset = 0; offset <= HORIZON_JOURS; offset++) {
        const d = dateStr(offset)
        const weekday = new Date(`${d}T12:00`).getDay()
        const hsJour = mesHeures.filter((h) => h.weekday === weekday)
        const occJour = mesOccupes.filter((o) =>
          new Date(o.starts_at).toISOString().slice(0, 10) === d
        )
        const slots = hsJour.length
          ? computeSlots(hsJour, occJour, d, dureeMin)
          : []
        if (!prochain && slots.length > 0) prochain = slots[0]
        if (offset < NB_JOURS_DISPO) {
          jours.push({
            date: d,
            offset,
            ouvert: hsJour.length > 0,
            matin: slots.some((t) => t.getHours() < 12),
            apresMidi: slots.some((t) => t.getHours() >= 12),
          })
        }
      }
      parSalon[s.id] = { prochain, jours }
    }
    return parSalon
  }, [salons, prestations, heures, occupes])

  const visibles = useMemo(() => {
    const motsQ = normaliser(params.get('q')).split(/\s+/).filter(Boolean)
    const tl = normaliser(params.get('ou'))

    // Avant la migration 002, s.genres est absent : on ne filtre pas.
    const aGenre = (s, g) => !Array.isArray(s.genres) || s.genres.includes(g)

    return salons.filter((s) => {
      const nomsSvc = (prestations[s.id] ?? []).map((x) => x.name).join(' ')
      const corpus = normaliser(
        `${s.name} ${s.description ?? ''} ${nomsSvc} ${s.quartier ?? ''} ${s.ville ?? ''}`
      )
      // Chaque mot recherché doit correspondre, sauf les mots génériques
      const matchQ = motsQ.every((mot) => {
        if (MOTS_GENERIQUES.has(mot)) return true
        if (mot === 'femme' || mot === 'femmes' || mot === 'dame' || mot === 'dames')
          return aGenre(s, 'femme')
        if (mot === 'homme' || mot === 'hommes') return aGenre(s, 'homme')
        return corpus.includes(mot)
      })
      const matchL =
        !tl || normaliser(`${s.quartier ?? ''} ${s.ville ?? ''}`).includes(tl)
      const matchG = !genre || aGenre(s, genre)
      return matchQ && matchL && matchG
    })
  }, [salons, prestations, params, genre])

  const lieuAffiche = params.get('ou') || 'Bujumbura'

  return (
    <>
      <SiteHeader />

      <div className="barre-outils">
        <form className="barre-recherche compacte" onSubmit={appliquer}>
          <div className="champ-recherche">
            <label htmlFor="rq2">{t('rech_quoi')}</label>
            <input
              id="rq2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('r_quoi_ph')}
            />
          </div>
          <div className="champ-recherche">
            <label htmlFor="rl2">{t('rech_ou')}</label>
            <input
              id="rl2"
              value={ou}
              onChange={(e) => setOu(e.target.value)}
              placeholder={t('rech_ou_ph')}
            />
          </div>
          <button type="submit" className="btn-rechercher" aria-label="Rechercher">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        <div className="filtres">
          <button
            className={`chip-filtre ${genre === 'femme' ? 'actif' : ''}`}
            onClick={() => basculeGenre('femme')}
          >
            {t('r_femme')}
          </button>
          <button
            className={`chip-filtre ${genre === 'homme' ? 'actif' : ''}`}
            onClick={() => basculeGenre('homme')}
          >
            {t('r_homme')}
          </button>
        </div>
      </div>

      <div className="recherche-layout">
        <div className={`colonne-resultats ${voirCarte ? 'cachee-mobile' : ''}`}>
          <h1 className="titre-resultats">{t('r_titre')}</h1>
          <p className="sous-titre">{t('r_sous', { lieu: lieuAffiche })}</p>

          {loading && (
            <div className="chargement"><span className="spinner" />{t('r_chargement')}</div>
          )}

          {!loading && visibles.length === 0 && (
            <div className="vide">
              {t('r_vide')}
              <br />
              {t('home_vide_cta')}{' '}
              <Link to="/pro">{t('home_vide_lien')}</Link>.
            </div>
          )}

          {visibles.map((s, i) => {
            const dispo = dispos[s.id]
            const svc = prestations[s.id] ?? []
            const ouvert = deplies.has(s.id)
            return (
              <div key={s.id} className="resultat-salon">
                <div className="resultat-haut">
                  <div
                    className="photo-resultat"
                    style={{
                      backgroundImage: `url(${
                        s.photos?.length
                          ? photoUrl(s.photos[0])
                          : PHOTOS_SALONS[i % PHOTOS_SALONS.length]
                      })`,
                    }}
                  />
                  <div className="infos-resultat">
                    <div className="nom">{s.name}</div>
                    <div className="meta">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {[s.adresse ?? s.quartier, s.ville ?? 'Bujumbura'].filter(Boolean).join(', ')}
                    </div>

                    <div className="dispo-prochaine">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M8 3v4M16 3v4M3 10h18" />
                      </svg>
                      {dispo?.prochain ? (
                        <>
                          {t('r_prochain')}{' '}
                          <strong>
                            {dispo.prochain.toLocaleDateString(locale, {
                              weekday: 'long', day: 'numeric', month: 'long',
                            })}{' '}
                            {t('b_a')} {formatTime(dispo.prochain)}
                          </strong>
                        </>
                      ) : (
                        <>{t('r_complet', { n: HORIZON_JOURS })}</>
                      )}
                    </div>
                  </div>
                </div>

                {dispo && (
                  <div className="jours-dispo">
                    {dispo.jours.map((j) => (
                      <div key={j.date} className="jour-dispo">
                        <span className="jour-label">{labelJour(j.offset)}</span>
                        <div className="periodes">
                          <button
                            className="chip-periode"
                            disabled={!j.matin}
                            title={j.ouvert ? '' : t('r_ferme')}
                            onClick={() => nav(`/s/${s.slug}?date=${j.date}`)}
                          >
                            {t('r_matin')}
                          </button>
                          <button
                            className="chip-periode"
                            disabled={!j.apresMidi}
                            title={j.ouvert ? '' : t('r_ferme')}
                            onClick={() => nav(`/s/${s.slug}?date=${j.date}`)}
                          >
                            {t('r_aprem')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {ouvert && (
                  <div className="details-salon">
                    {s.description ? (
                      <p className="desc-complete">{s.description}</p>
                    ) : (
                      <p className="desc-complete aide-champ">{t('r_sans_desc')}</p>
                    )}
                    {svc.length > 0 && (
                      <ul className="liste-prestations">
                        {svc.slice(0, 5).map((p) => (
                          <li key={p.name}>
                            <span>{p.name}</span>
                            <span className="pointille" />
                            <span className="duree">{p.duration_min} {t('b_min')}</span>
                            <span className="prix">{formatBif(p.price_bif, t('sur_devis'))}</span>
                          </li>
                        ))}
                        {svc.length > 5 && (
                          <li className="autres">{t('r_autres', { n: svc.length - 5 })}</li>
                        )}
                      </ul>
                    )}
                    {s.phone && (
                      <p className="tel-salon">
                        {t('r_tel')} <a href={`tel:${s.phone}`}>{s.phone}</a>
                      </p>
                    )}
                  </div>
                )}

                <div className="pied-resultat">
                  <button className="btn-savoir" onClick={() => basculeDetails(s.id)}>
                    {ouvert ? t('r_reduire') : t('r_savoir')}
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                      style={{ transform: ouvert ? 'rotate(180deg)' : 'none' }}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Link to={`/s/${s.slug}`} className="pill pill-noir">
                    {t('r_rdv')}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`colonne-carte ${voirCarte ? '' : 'cachee-mobile'}`}>
          <CarteSalons salons={visibles} />
        </div>
      </div>

      <button
        className="bascule-carte pill pill-noir"
        onClick={() => setVoirCarte(!voirCarte)}
      >
        {voirCarte ? t('r_voir_liste') : t('r_voir_carte')}
      </button>
    </>
  )
}
