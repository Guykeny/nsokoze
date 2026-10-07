import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

export default function NotFound() {
  const { t } = useLang()
  useMeta({ titre: t('nf_titre'), noindex: true })

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ textAlign: 'center' }}>
        <p className="code-404" aria-hidden="true">404</p>
        <h1>{t('nf_titre')}</h1>
        <p className="sous-titre">{t('nf_texte')}</p>
        <div className="actions-salon" style={{ justifyContent: 'center' }}>
          <Link to="/" className="btn btn-pilule">{t('nf_accueil')}</Link>
          <Link to="/recherche" className="btn btn-pilule btn-secondaire">{t('pied_lien_recherche')}</Link>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
