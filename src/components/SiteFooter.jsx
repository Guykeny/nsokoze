import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories.js'
import { CATEGORIES_BLOG } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'

export default function SiteFooter() {
  const { t, lang } = useLang()

  return (
    <footer className="pied-riche">
      <div className="pied-riche-inner">
        <div className="pied-colonne pied-marque">
          <span className="logo-pied">Nsokoze</span>
          <p>{t('pied_description')}</p>
        </div>

        <div className="pied-colonne">
          <h3>{t('pied_col_prestations')}</h3>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/c/${c.slug}`}>
              {lang === 'en' && c.nom_en ? c.nom_en : c.nom}
            </Link>
          ))}
        </div>

        <div className="pied-colonne">
          <h3>{t('pied_col_blog')}</h3>
          <Link to="/blog">{t('nav_blog')}</Link>
          {CATEGORIES_BLOG.map((c) => (
            <Link key={c.id} to={`/blog?cat=${c.id}`}>
              {lang === 'en' ? c.nom_en : c.nom}
            </Link>
          ))}
        </div>

        <div className="pied-colonne">
          <h3>{t('pied_col_nsokoze')}</h3>
          <Link to="/recherche">{t('pied_lien_recherche')}</Link>
          <Link to="/pro">{t('pied_lien_pro')}</Link>
          <Link to="/compte">{t('header_compte')}</Link>
        </div>
      </div>

      <div className="pied-riche-bas">
        © {new Date().getFullYear()} Nsokoze — {t('pied_slogan')}
      </div>
    </footer>
  )
}
