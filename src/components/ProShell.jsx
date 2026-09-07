import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

export default function ProShell({ salon, children }) {
  const nav = useNavigate()
  const { t } = useLang()

  async function logout() {
    await supabase.auth.signOut()
    nav('/pro')
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="logo">Nsokoze</Link>
          <div className="header-actions">
            <button className="btn-lien" onClick={logout}>{t('p_deconnexion')}</button>
          </div>
        </div>
      </header>
      <div className="page">
        {salon && <p className="surtitre">{salon.name}</p>}
        <nav className="onglets">
          <NavLink
            to="/pro/agenda"
            className={({ isActive }) => `onglet ${isActive ? 'actif' : ''}`}
          >
            {t('p_agenda')}
          </NavLink>
          <NavLink
            to="/pro/services"
            className={({ isActive }) => `onglet ${isActive ? 'actif' : ''}`}
          >
            {t('p_services')}
          </NavLink>
        </nav>
        {children}
      </div>
    </>
  )
}
