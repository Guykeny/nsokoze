import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'

export default function SiteHeader() {
  const { lang, setLang, t } = useLang()
  const [ouvert, setOuvert] = useState(false)

  function fermer() {
    setOuvert(false)
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="logo" onClick={fermer}>Nsokoze</Link>

        <nav className="nav-categories">
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/c/${c.slug}`}>
              {lang === 'en' && c.nom_en ? c.nom_en : c.nom}
            </NavLink>
          ))}
          <NavLink to="/blog">{t('nav_blog')}</NavLink>
        </nav>

        <div className="header-actions">
          <div className="lang-toggle" role="group" aria-label="Langue / Language">
            <button
              className={lang === 'fr' ? 'actif' : ''}
              onClick={() => setLang('fr')}
            >
              FR
            </button>
            <button
              className={lang === 'en' ? 'actif' : ''}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
          <Link to="/pro" className="pill pill-gris">
            {t('header_pro')}
          </Link>
          <Link to="/compte" className="pill pill-noir">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
            <span>{t('header_compte')}</span>
          </Link>

          <button
            className="bouton-menu"
            aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={ouvert}
            onClick={() => setOuvert((v) => !v)}
          >
            {ouvert ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {ouvert && (
        <>
          <div className="voile-menu" onClick={fermer} />
          <nav className="menu-mobile">
            <p className="menu-mobile-titre">{t('menu_prestations')}</p>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/c/${c.slug}`} onClick={fermer}>
                {lang === 'en' && c.nom_en ? c.nom_en : c.nom}
              </Link>
            ))}
            <Link to="/blog" onClick={fermer}>{t('nav_blog')}</Link>

            <div className="menu-mobile-separateur" />

            <Link to="/recherche" className="pill pill-noir" onClick={fermer}>
              {t('pied_lien_recherche')}
            </Link>
            <Link to="/pro" className="pill pill-gris" onClick={fermer}>
              {t('header_pro')}
            </Link>
            <Link to="/compte" className="pill pill-gris menu-mobile-compte" onClick={fermer}>
              {t('header_compte')}
            </Link>

            <div className="lang-toggle lang-toggle-mobile" role="group" aria-label="Langue / Language">
              <button className={lang === 'fr' ? 'actif' : ''} onClick={() => setLang('fr')}>FR</button>
              <button className={lang === 'en' ? 'actif' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
