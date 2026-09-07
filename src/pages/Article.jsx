import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, blogPhotoUrl, dureeLecture } from '../lib/supabase'
import { libelleCategorieBlog } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

export default function Article() {
  const { slug } = useParams()
  const { t, lang, locale } = useLang()
  const [article, setArticle] = useState(undefined) // undefined = chargement, null = introuvable

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('publie', true)
      .maybeSingle()
      .then(({ data }) => setArticle(data ?? null))
  }, [slug])

  if (article === undefined) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />{t('r_chargement')}</div>
        </div>
      </>
    )
  }

  if (article === null) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>{t('blog_introuvable')}</h1>
          <p className="sous-titre">
            <Link to="/blog">{t('blog_retour')}</Link>
          </p>
        </div>
      </>
    )
  }

  const titre = lang === 'en' && article.titre_en ? article.titre_en : article.titre
  const contenu = lang === 'en' && article.contenu_en ? article.contenu_en : article.contenu
  const paragraphes = contenu.split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 720 }}>
        <p className="sous-titre" style={{ marginBottom: 4 }}>
          <Link to="/blog">← {t('blog_titre')}</Link>
        </p>
        <span className="badge-categorie">{libelleCategorieBlog(article.categorie, lang)}</span>
        <h1 style={{ marginTop: 10 }}>{titre}</h1>
        <p className="date-article" style={{ display: 'block', marginBottom: 20 }}>
          {new Date(article.created_at).toLocaleDateString(locale, {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
          {' · '}
          {t('blog_lecture', { n: dureeLecture(contenu) })}
        </p>

        {article.image && (
          <img
            className="photo-article-pleine"
            src={blogPhotoUrl(article.image)}
            alt={titre}
          />
        )}

        <article className="texte-editorial" style={{ margin: '20px 0' }}>
          {paragraphes.map((p, i) => <p key={i}>{p}</p>)}
        </article>

        <section className="cta-pro">
          <h2>{t('home_cta_titre')}</h2>
          <p>{t('home_cta_texte')}</p>
          <Link to="/pro" className="btn-or">{t('home_cta_btn')}</Link>
        </section>
      </div>
      <SiteFooter />
    </>
  )
}
