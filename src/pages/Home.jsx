import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categorieParSlug } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import { supabase, photoUrl, formatTime, prochainCreneau } from '../lib/supabase'
import { instantBuj, jourBuj, jourBujOffset, dateLocale } from '../lib/temps.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

// Photo du hero : portrait éditorial, en attendant une vraie photo de salon burundais
const PHOTO_HERO =
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=2000&q=75'

const CATEGORIES_ACCUEIL = [
  {
    id: 'coiffure',
    photo: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'barbier',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'manucure',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'institut-de-beaute',
    photo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'bien-etre',
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=500&q=70',
  },
]

const QUARTIERS = ['Rohero', 'Bwiza', 'Kamenge', 'Ngagara', 'Buyenzi', 'Kinindo']

const NB_SALONS = 6
const HORIZON = 7 // jours explorés pour le prochain créneau

function initiales(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

/** Salons avec leur prochain créneau libre et leur note, les plus disponibles d'abord. */
function useSalonsDisponibles() {
  const [salons, setSalons] = useState(null) // null = chargement

  useEffect(() => {
    const debut = instantBuj(jourBujOffset(0), '00:00').toISOString()
    const fin = instantBuj(jourBujOffset(HORIZON), '23:59:59').toISOString()
    Promise.all([
      supabase.from('salons').select('id, name, slug, quartier, ville, photos'),
      supabase.from('services').select('salon_id, duration_min').eq('is_active', true),
      supabase.from('opening_hours').select('salon_id, weekday, opens_at, closes_at'),
      supabase.from('occupied_slots').select('salon_id, starts_at, ends_at')
        .gte('starts_at', debut).lte('starts_at', fin),
      supabase.from('salon_notes').select('salon_id, moyenne, nb'),
    ]).then(([{ data: sal }, { data: svc }, { data: hrs }, { data: occ }, { data: notes }]) => {
      const liste = (sal ?? []).map((s) => {
        const durees = (svc ?? []).filter((x) => x.salon_id === s.id).map((x) => x.duration_min || 60)
        const prochain = durees.length
          ? prochainCreneau(
              (hrs ?? []).filter((h) => h.salon_id === s.id),
              (occ ?? []).filter((o) => o.salon_id === s.id),
              Math.min(...durees),
              HORIZON
            )
          : null
        return { ...s, prochain, note: (notes ?? []).find((n) => n.salon_id === s.id) ?? null }
      })
      // Disponibles le plus tôt d'abord, puis les mieux notés
      liste.sort((a, b) =>
        (a.prochain ?? Infinity) - (b.prochain ?? Infinity) ||
        (b.note?.moyenne ?? 0) - (a.note?.moyenne ?? 0)
      )
      setSalons(liste)
    })
  }, [])

  return salons
}

export default function Home() {
  const nav = useNavigate()
  const { t, lang, locale } = useLang()
  useMeta({})
  const [q, setQ] = useState('')
  const [lieu, setLieu] = useState('')
  const salons = useSalonsDisponibles()

  function rechercher(e) {
    e?.preventDefault()
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (lieu.trim()) p.set('ou', lieu.trim())
    nav(`/recherche?${p.toString()}`)
  }

  function quandCreneau(d) {
    const jour = jourBuj(d)
    const libelle =
      jour === jourBujOffset(0) ? t('r_auj')
        : jour === jourBujOffset(1) ? t('r_demain')
          : dateLocale(d, locale, { weekday: 'short', day: 'numeric' })
    return `${libelle} ${formatTime(d)}`
  }

  return (
    <>
      <SiteHeader />

      <section
        className="hero-planity hero-photo"
        style={{ backgroundImage: `url(${PHOTO_HERO})` }}
      >
        <div className="hero-contenu">
          <p className="kaze">{t('home_kaze')}</p>
          <h1>{t('home_titre')}</h1>
          <p className="devise">
            {t('devise_simple')} <span className="point">•</span> {t('devise_immediat')}
            <span className="point">•</span> {t('devise_24')}
          </p>
          <form className="barre-recherche" onSubmit={rechercher}>
            <div className="champ-recherche">
              <label htmlFor="rq">{t('rech_quoi')}</label>
              <input
                id="rq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('rech_quoi_ph')}
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="rl">{t('rech_ou')}</label>
              <input
                id="rl"
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder={t('rech_ou_ph')}
              />
            </div>
            <button type="submit" className="btn-rechercher">{t('rech_btn')}</button>
          </form>
          <div className="chips-hero">
            {QUARTIERS.map((qt) => (
              <Link key={qt} to={`/recherche?ou=${encodeURIComponent(qt)}`} className="chip-hero">
                {qt}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="conteneur">
        {/* ----- Catégories ----- */}
        <section className="section section-serree">
          <div className="grille-categories">
            {CATEGORIES_ACCUEIL.map((c) => {
              const info = categorieParSlug(c.id)
              return (
                <Link key={c.id} to={`/c/${c.id}`} className="tuile-categorie">
                  <img src={c.photo} alt="" loading="lazy" />
                  <span>{lang === 'en' && info?.nom_en ? info.nom_en : info?.nom}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ----- Salons disponibles ----- */}
        <section className="section">
          <div className="entete-section">
            <h2 className="section-titre">{t('home_dispo_titre')}</h2>
            <Link to="/recherche" className="lien-voir-tout">{t('home_voir_tout')} →</Link>
          </div>

          {salons === null && (
            <div className="chargement"><span className="spinner" />{t('r_chargement')}</div>
          )}

          {salons?.length === 0 && (
            <div className="vide">
              {t('home_vide')}
              <br />
              {t('home_vide_cta')} <Link to="/pro">{t('home_vide_lien')}</Link>.
            </div>
          )}

          {salons?.length > 0 && (
            <div className="grille-salons grille-dispo">
              {salons.slice(0, NB_SALONS).map((s) => (
                <Link key={s.id} to={`/s/${s.slug}`} className="carte-salon">
                  <div
                    className="photo-salon"
                    style={s.photos?.length ? { backgroundImage: `url(${photoUrl(s.photos[0])})` } : undefined}
                  >
                    {!s.photos?.length && <span className="initiales">{initiales(s.name)}</span>}
                  </div>
                  <div className="infos-salon">
                    <div className="nom">{s.name}</div>
                    <div className="meta">
                      {[s.quartier, s.ville].filter(Boolean).join(', ')}
                    </div>
                    <div className="meta">
                      {s.note
                        ? <span className="note-carte">★ {s.note.moyenne} ({s.note.nb})</span>
                        : <span>{t('home_nouveau')}</span>}
                    </div>
                    <div className={`dispo-carte ${s.prochain ? '' : 'complet'}`}>
                      {s.prochain
                        ? quandCreneau(s.prochain)
                        : t('r_complet', { n: HORIZON })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="une-ligne">{t('home_une_ligne')}</p>
        </section>

        <section className="cta-pro">
          <h2>{t('home_vide_cta')}</h2>
          <p>{t('home_cta2_texte')}</p>
          <Link to="/pro" className="btn-or">{t('home_cta_btn')}</Link>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
