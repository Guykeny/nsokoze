import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories.js'
import { useLang } from '../lib/i18n.jsx'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession.js'

function IconeCompte() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  )
}

/** Bouton de compte : « Se connecter » ou prénom + menu déroulant. */
function BoutonCompte({ compte, onDeconnexion }) {
  const { t } = useLang()
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)

  // Ferme le menu au clic extérieur ou sur Échap
  useEffect(() => {
    if (!ouvert) return
    const clic = (e) => { if (!ref.current?.contains(e.target)) setOuvert(false) }
    const touche = (e) => { if (e.key === 'Escape') setOuvert(false) }
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('keydown', touche)
    }
  }, [ouvert])

  if (!compte) {
    return (
      <Link to="/compte" className="pill pill-noir">
        <IconeCompte />
        <span>{t('header_connexion')}</span>
      </Link>
    )
  }

  return (
    <div className="menu-compte" ref={ref}>
      <button
        className="pill pill-connecte"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        title={t('header_connecte_en_tant', { email: compte.email })}
        onClick={() => setOuvert((v) => !v)}
      >
        <span className="avatar-mini" aria-hidden="true">
          {(compte.prenom[0] ?? '?').toUpperCase()}
        </span>
        <span className="prenom-compte">{compte.prenom}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {ouvert && (
        <div className="menu-compte-liste" role="menu">
          <p className="menu-compte-email">{compte.email}</p>
          <Link role="menuitem" to="/compte" onClick={() => setOuvert(false)}>
            {t('header_mes_rdv')}
          </Link>
          {compte.aUnSalon && (
            <Link role="menuitem" to="/pro/agenda" onClick={() => setOuvert(false)}>
              {t('header_mon_agenda')}
            </Link>
          )}
          <button role="menuitem" onClick={() => { setOuvert(false); onDeconnexion() }}>
            {t('c_deconnexion')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SiteHeader() {
  const { lang, setLang, t } = useLang()
  const nav = useNavigate()
  const compte = useSession()
  const [ouvert, setOuvert] = useState(false)

  function fermer() {
    setOuvert(false)
  }

  async function deconnexion() {
    setOuvert(false)
    await supabase.auth.signOut()
    nav('/')
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
        </nav>

        <div className="header-actions">
          <div className="lang-toggle" role="group" aria-label="Langue / Language / Ururimi">
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
            <button
              className={lang === 'kir' ? 'actif' : ''}
              onClick={() => setLang('kir')}
              title="Kirundi — brouillon non relu par un locuteur natif"
            >
              KIR
            </button>
          </div>
          {compte?.aUnSalon ? (
            <Link to="/pro/agenda" className="pill pill-gris">
              {t('header_mon_agenda')}
            </Link>
          ) : (
            <Link to="/pro" className="pill pill-gris">
              {t('header_pro')}
            </Link>
          )}
          {/* Rien tant que la session n'est pas vérifiée : évite un « Se connecter » fugace */}
          {compte !== undefined && <BoutonCompte compte={compte} onDeconnexion={deconnexion} />}

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

            <div className="menu-mobile-separateur" />

            <Link to="/recherche" className="pill pill-noir" onClick={fermer}>
              {t('pied_lien_recherche')}
            </Link>
            {compte?.aUnSalon ? (
              <Link to="/pro/agenda" className="pill pill-gris" onClick={fermer}>
                {t('header_mon_agenda')}
              </Link>
            ) : (
              <Link to="/pro" className="pill pill-gris" onClick={fermer}>
                {t('header_pro')}
              </Link>
            )}
            {compte ? (
              <>
                <p className="menu-mobile-connecte">
                  {t('header_connecte_en_tant', { email: compte.email })}
                </p>
                <Link to="/compte" className="pill pill-gris" onClick={fermer}>
                  {t('header_mes_rdv')}
                </Link>
                <button className="btn-lien menu-mobile-deconnexion" onClick={deconnexion}>
                  {t('c_deconnexion')}
                </button>
              </>
            ) : (
              <Link to="/compte" className="pill pill-gris menu-mobile-compte" onClick={fermer}>
                {t('header_connexion')}
              </Link>
            )}

            {/* Contenu éditorial : en fin de menu, après tout ce qui sert à réserver */}
            <div className="menu-mobile-separateur" />
            <Link to="/blog" onClick={fermer}>{t('nav_blog')}</Link>

            <div className="lang-toggle lang-toggle-mobile" role="group" aria-label="Langue / Language / Ururimi">
              <button className={lang === 'fr' ? 'actif' : ''} onClick={() => setLang('fr')}>FR</button>
              <button className={lang === 'en' ? 'actif' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'kir' ? 'actif' : ''} onClick={() => setLang('kir')} title="Kirundi — brouillon">KIR</button>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
