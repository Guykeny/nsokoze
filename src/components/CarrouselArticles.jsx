import { Link } from 'react-router-dom'
import { blogPhotoUrl, dureeLecture } from '../lib/supabase'
import { libelleCategorieBlog } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'

/** Bandeau d'articles qui défile en boucle, de droite à gauche.
 *  La liste est dupliquée pour créer l'illusion d'un défilement infini ;
 *  l'animation se met en pause au survol pour laisser le temps de lire. */
export default function CarrouselArticles({ articles }) {
  const { t, lang } = useLang()

  if (articles.length === 0) return null

  // Peu d'articles : on double la liste pour garder une boucle fluide
  const doublee = articles.length < 6 ? [...articles, ...articles] : articles
  const piste = [...doublee, ...doublee]

  return (
    <div className="carrousel-articles">
      <div className="carrousel-piste">
        {piste.map((a, i) => {
          const titre = lang === 'en' && a.titre_en ? a.titre_en : a.titre
          const extrait = lang === 'en' && a.extrait_en ? a.extrait_en : a.extrait
          const contenu = lang === 'en' && a.contenu_en ? a.contenu_en : a.contenu
          return (
            <Link key={`${a.id}-${i}`} to={`/blog/${a.slug}`} className="carte-article">
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
    </div>
  )
}
