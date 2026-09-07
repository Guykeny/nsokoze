import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { categorieParSlug } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'

export default function Categorie() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { t, lang } = useLang()
  const cat = categorieParSlug(slug)

  const [q, setQ] = useState('')
  const [ou, setOu] = useState('')

  if (!cat) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>{t('cat_introuvable')}</h1>
          <p className="sous-titre">
            <Link to="/">{t('cat_retour')}</Link>
          </p>
        </div>
      </>
    )
  }

  const en = lang === 'en'
  const titre = en ? cat.titre_en : cat.titre
  const nom = en ? cat.nom_en : cat.nom
  const intro = en ? cat.intro_en : cat.intro

  function rechercher(e) {
    e.preventDefault()
    const p = new URLSearchParams()
    p.set('q', q.trim() || cat.qDefaut)
    if (ou.trim()) p.set('ou', ou.trim())
    nav(`/recherche?${p.toString()}`)
  }

  const [debut, dernierMot] = decouperTitre(titre)

  return (
    <>
      <SiteHeader />

      <section className="hero-categorie" style={{ background: cat.teinte }}>
        <div className="hero-contenu">
          <h1>
            {debut}{' '}
            <span style={{ color: cat.accent }}>{dernierMot}</span>
          </h1>
          <form className="barre-recherche" onSubmit={rechercher}>
            <div className="champ-recherche">
              <label htmlFor="cq">{t('rech_quoi')}</label>
              <input
                id="cq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  cat.sousCategories
                    .map((s) => (en ? s.nom_en : s.nom))
                    .join(', ') + '…'
                }
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="co">{t('rech_ou')}</label>
              <input
                id="co"
                value={ou}
                onChange={(e) => setOu(e.target.value)}
                placeholder={t('rech_ou_ph')}
              />
            </div>
            <button type="submit" className="btn-rechercher">{t('rech_btn')}</button>
          </form>
        </div>
      </section>

      <main className="conteneur">
        <section className="section">
          <p className="surtitre">{nom}</p>
          <div className="grille-salons">
            {cat.sousCategories.map((sc) => (
              <Link
                key={sc.nom}
                to={`/recherche?q=${encodeURIComponent(sc.q)}`}
                className="carte-salon"
              >
                <div
                  className="photo-salon"
                  style={{ backgroundImage: `url(${sc.photo})` }}
                />
                <div className="infos-salon">
                  <div className="meta">{t('home_decouvrez')}</div>
                  <div className="nom">{en ? sc.nom_en : sc.nom}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <article className="texte-editorial">
          <p className="intro">{intro}</p>
          {cat.sections.map((sec) => (
            <section key={sec.titre}>
              <h2>{en ? sec.titre_en : sec.titre}</h2>
              {(en ? sec.paragraphes_en : sec.paragraphes).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </article>

        <section className="cta-pro">
          <h2>{t('cat_cta_titre')}</h2>
          <p>{t('cat_cta_texte')}</p>
          <Link to="/pro" className="btn-or">{t('home_cta_btn')}</Link>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

// « Réserver en ligne un RDV bien-être » → colorie le dernier mot
function decouperTitre(titre) {
  const mots = titre.split(' ')
  const dernier = mots.pop()
  return [mots.join(' '), dernier]
}
