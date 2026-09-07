import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categorieParSlug } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

// Photo du hero : portrait éditorial, en attendant une vraie photo de salon burundais
const PHOTO_HERO =
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=2000&q=75'

const CATEGORIES_HERO = [
  {
    id: 'coiffure',
    photo: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=700&q=70',
  },
  {
    id: 'barbier',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=70',
  },
  {
    id: 'manucure',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=70',
  },
  {
    id: 'institut-de-beaute',
    photo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=70',
  },
  {
    id: 'bien-etre',
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=70',
  },
]

// Photo pour la section « histoire » : portrait, personne aux cheveux afro
const PHOTO_HISTOIRE =
  'https://images.unsplash.com/photo-1707741902060-f6caee412f26?auto=format&fit=crop&w=1400&q=75'

const QUARTIERS = ['Rohero', 'Bwiza', 'Kamenge', 'Ngagara', 'Buyenzi', 'Kinindo']

export default function Home() {
  const nav = useNavigate()
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const [lieu, setLieu] = useState('')
  const [indexCat, setIndexCat] = useState(0)

  const catActive = CATEGORIES_HERO[indexCat]
  const infoCat = categorieParSlug(catActive.id)

  function catPrecedente() {
    setIndexCat((i) => (i - 1 + CATEGORIES_HERO.length) % CATEGORIES_HERO.length)
  }
  function catSuivante() {
    setIndexCat((i) => (i + 1) % CATEGORIES_HERO.length)
  }

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

      <div className="carrousel-pro-section">
        <div className="carrousel-pro">
          <div className="carrousel-pro-photo">
            <img
              src={CATEGORIES_HERO[(indexCat - 1 + CATEGORIES_HERO.length) % CATEGORIES_HERO.length].photo}
              alt=""
              loading="lazy"
            />
          </div>
          <div className="carrousel-pro-photo carrousel-pro-photo-active">
            <img src={catActive.photo} alt="" loading="lazy" />
          </div>
          <div className="carrousel-pro-texte">
            <h2 className="section-titre">{t('home_pro_titre')}</h2>
            <p className="carrousel-pro-nom">
              {lang === 'en' && infoCat?.nom_en ? infoCat.nom_en : infoCat?.nom}
            </p>
            <p className="section-sous" style={{ margin: '0 0 16px' }}>
              {t(`home_pro_txt_${catActive.id.replace(/-/g, '_')}`)}
            </p>
            <Link to={`/c/${catActive.id}`} className="carrousel-pro-lien">
              {t('home_pro_lien')}
            </Link>
            <div className="carrousel-pro-nav">
              <button
                className="carrousel-pro-fleche"
                aria-label="Catégorie précédente"
                onClick={catPrecedente}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
              </button>
              <button
                className="carrousel-pro-fleche"
                aria-label="Catégorie suivante"
                onClick={catSuivante}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          <div className="carrousel-pro-photo carrousel-pro-photo-deborde">
            <img
              src={CATEGORIES_HERO[(indexCat + 1) % CATEGORIES_HERO.length].photo}
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <main className="conteneur">
        <section className="section histoire-section">
          <div className="histoire-bloc">
            <div className="histoire-photo">
              <img src={PHOTO_HISTOIRE} alt="" loading="lazy" />
            </div>
            <div className="histoire-texte">
              <p className="surtitre">{t('home_histoire_surtitre')}</p>
              <h2 className="section-titre">{t('home_histoire_titre')}</h2>
              <p>{t('home_histoire_p1')}</p>
              <p>{t('home_histoire_p2')}</p>
            </div>
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

      <SiteFooter />
    </>
  )
}
