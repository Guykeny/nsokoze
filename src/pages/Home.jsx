import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, photoUrl } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'

// Photos d'illustration en attendant les vraies photos des salons
const PHOTOS_SALONS = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=60',
]

// Tuiles aux couleurs de la marque : pas de fausses photos de villes
const VILLES = [
  { nom: 'Bujumbura', fond: 'linear-gradient(140deg, #8a3570, #4a1839)' },
  { nom: 'Gitega', fond: 'linear-gradient(140deg, #d9973a, #a5641c)' },
  { nom: 'Ngozi', fond: 'linear-gradient(140deg, #3c2a40, #241627)' },
]

const QUARTIERS = ['Rohero', 'Bwiza', 'Kamenge', 'Ngagara', 'Buyenzi', 'Kinindo']

function initiales(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function Home() {
  const nav = useNavigate()
  const { t } = useLang()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [lieu, setLieu] = useState('')

  useEffect(() => {
    supabase
      .from('salons')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        setSalons(data ?? [])
        setLoading(false)
      })
  }, [])

  function rechercher(e) {
    e?.preventDefault()
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    if (lieu.trim()) p.set('ou', lieu.trim())
    nav(`/recherche?${p.toString()}`)
  }

  return (
    <>
      <SiteHeader />

      <section className="hero-planity">
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
        <section className="section">
          <h2 className="section-titre">{t('home_villes_titre')}</h2>
          <p className="section-sous">{t('home_villes_sous')}</p>
          <div className="grille-salons">
            {VILLES.map((v) => (
              <Link
                key={v.nom}
                to={`/recherche?ou=${encodeURIComponent(v.nom)}`}
                className="carte-salon"
              >
                <div className="tuile-ville" style={{ background: v.fond }}>
                  <span className="lettre" aria-hidden="true">{v.nom[0]}</span>
                </div>
                <div className="infos-salon">
                  <div className="meta">{t('home_decouvrez')}</div>
                  <div className="nom">{t('home_salons_a')} {v.nom}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-titre">{t('home_dispo_titre')}</h2>
          <p className="section-sous">{t('home_dispo_sous')}</p>

          {loading && (
            <div className="grille-salons">
              <div className="squelette carte-fantome" />
              <div className="squelette carte-fantome" />
              <div className="squelette carte-fantome" />
              <div className="squelette carte-fantome" />
            </div>
          )}

          {!loading && salons.length === 0 && (
            <div className="vide">
              {t('home_vide')}
              <br />
              {t('home_vide_cta')}{' '}
              <Link to="/pro">{t('home_vide_lien')}</Link>.
            </div>
          )}

          <div className="grille-salons">
            {salons.map((s, i) => (
              <Link key={s.id} to={`/s/${s.slug}`} className="carte-salon">
                <div
                  className="photo-salon"
                  style={{
                    backgroundImage: `url(${
                      s.photos?.length
                        ? photoUrl(s.photos[0])
                        : PHOTOS_SALONS[i % PHOTOS_SALONS.length]
                    })`,
                  }}
                >
                  {!s.photos?.length && (
                    <span className="initiales" aria-hidden="true">
                      {initiales(s.name)}
                    </span>
                  )}
                </div>
                <div className="infos-salon">
                  <div className="nom">{s.name}</div>
                  {s.quartier && (
                    <div className="meta">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {s.quartier}
                    </div>
                  )}
                  {s.description && <div className="desc">{s.description}</div>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-titre">{t('home_cm_titre')}</h2>
          <p className="section-sous">{t('home_cm_sous')}</p>
          <div className="etapes">
            <div className="etape-carte">
              <span className="etape-num">1</span>
              <h3>{t('home_e1_t')}</h3>
              <p>{t('home_e1_p')}</p>
            </div>
            <div className="etape-carte">
              <span className="etape-num">2</span>
              <h3>{t('home_e2_t')}</h3>
              <p>{t('home_e2_p')}</p>
            </div>
            <div className="etape-carte">
              <span className="etape-num">3</span>
              <h3>{t('home_e3_t')}</h3>
              <p>{t('home_e3_p')}</p>
            </div>
          </div>
        </section>

        <section className="cta-pro">
          <h2>{t('home_cta_titre')}</h2>
          <p>{t('home_cta_texte')}</p>
          <Link to="/pro" className="btn-or">{t('home_cta_btn')}</Link>
        </section>
      </main>

      <footer className="pied">
        <span className="logo-pied">Nsokoze</span>
        {t('pied_slogan')}
      </footer>
    </>
  )
}
