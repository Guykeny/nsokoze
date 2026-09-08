import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, blogPhotoUrl, dureeLecture } from '../lib/supabase'
import { CATEGORIES_BLOG, libelleCategorieBlog } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import Faq from '../components/Faq.jsx'
import CarrouselArticles from '../components/CarrouselArticles.jsx'
import { useEstAdmin } from '../lib/useEstAdmin.js'

export default function Blog() {
  const { t, lang, locale } = useLang()
  const estAdmin = useEstAdmin()
  const [params, setParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const filtre = params.get('cat')

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, slug, categorie, titre, titre_en, extrait, extrait_en, contenu, contenu_en, image, created_at')
      .eq('publie', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles(data ?? [])
        setLoading(false)
      })
  }, [])

  const visibles = useMemo(
    () => (filtre ? articles.filter((a) => a.categorie === filtre) : articles),
    [articles, filtre]
  )

  function choisirCategorie(id) {
    if (id === filtre) setParams({})
    else setParams({ cat: id })
  }

  const questionsFaq = [
    { q: t('blog_faq_q1'), r: t('blog_faq_r1') },
    { q: t('blog_faq_q2'), r: t('blog_faq_r2') },
    { q: t('blog_faq_q3'), r: t('blog_faq_r3') },
    { q: t('blog_faq_q4'), r: t('blog_faq_r4') },
  ]

  return (
    <>
      <SiteHeader />

      <section className="hero-blog">
        <div className="hero-blog-inner">
          <p className="surtitre" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('blog_surtitre')}</p>
          <h1>{t('blog_titre')}</h1>
          <p className="sous-titre" style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {t('blog_sous')}
          </p>
        </div>
      </section>

      <div className="conteneur">
        <section className="section">
          <div className="barre-filtres-blog">
            <div className="filtres">
              <button
                className={`chip-filtre ${!filtre ? 'actif' : ''}`}
                onClick={() => setParams({})}
              >
                {t('blog_tous')}
              </button>
              {CATEGORIES_BLOG.map((c) => (
                <button
                  key={c.id}
                  className={`chip-filtre ${filtre === c.id ? 'actif' : ''}`}
                  onClick={() => choisirCategorie(c.id)}
                >
                  {lang === 'en' ? c.nom_en : c.nom}
                </button>
              ))}
            </div>

            {estAdmin && (
              <div className="boutons-admin-blog">
                <Link to="/admin/kpi" className="bouton-admin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 19V9M12 19V5M20 19v-7" />
                  </svg>
                  Tableau de bord
                </Link>
                <Link to="/admin/blog" className="bouton-admin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t('blog_ajouter_admin')}
                </Link>
              </div>
            )}
          </div>

          {loading && (
            <div className="grille-articles">
              <div className="squelette carte-fantome" />
              <div className="squelette carte-fantome" />
              <div className="squelette carte-fantome" />
            </div>
          )}

          {!loading && visibles.length === 0 && (
            <div className="vide">{t('blog_vide')}</div>
          )}

          {!loading && visibles.length > 0 && !filtre && (
            <CarrouselArticles articles={visibles} />
          )}

          {!loading && visibles.length > 0 && filtre && (
            <div className="grille-articles">
              {visibles.map((a) => {
                const titre = lang === 'en' && a.titre_en ? a.titre_en : a.titre
                const extrait = lang === 'en' && a.extrait_en ? a.extrait_en : a.extrait
                const contenu = lang === 'en' && a.contenu_en ? a.contenu_en : a.contenu
                return (
                  <Link key={a.id} to={`/blog/${a.slug}`} className="carte-article">
                    <div className="photo-article">
                      {a.image && (
                        <img src={blogPhotoUrl(a.image)} alt="" loading="lazy" />
                      )}
                      <span className="badge-categorie flottant">
                        {libelleCategorieBlog(a.categorie, lang)}
                      </span>
                    </div>
                    <div className="infos-article">
                      <h2>{titre}</h2>
                      {extrait && <p>{extrait}</p>}
                      <span className="meta-article">
                        {t('blog_lecture', { n: dureeLecture(contenu) })}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <Faq
          surtitre={t('blog_faq_surtitre')}
          titre={t('blog_faq_titre')}
          sous={t('blog_faq_sous')}
          questions={questionsFaq}
        />

        <section className="cta-pro cta-blog">
          <h2>{t('blog_cta_titre')}</h2>
          <p>{t('blog_cta_texte')}</p>
          <Link to="/pro" className="btn-or">{t('blog_cta_btn')}</Link>
        </section>
      </div>

      <SiteFooter />
    </>
  )
}
