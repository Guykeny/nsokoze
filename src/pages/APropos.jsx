import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import { CONTACT } from '../lib/config.js'
import { telInternational } from '../lib/supabase'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

export default function APropos() {
  const { t } = useLang()
  useMeta({ titre: t('pied_apropos'), description: t('ap_p1') })

  return (
    <>
      <SiteHeader />
      <div className="page page-texte">
        <h1>{t('ap_titre')}</h1>
        <p>{t('ap_p1')}</p>
        <p>{t('ap_p2')}</p>

        <h2 id="contact">{t('ap_contact_titre')}</h2>
        <p>{t('ap_contact_texte')}</p>
        <div className="recap">
          <div className="ligne-recap">
            <span>{t('ap_email')}</span>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </div>
          <div className="ligne-recap">
            <span>{t('ap_whatsapp')}</span>
            <a href={`https://wa.me/${telInternational(CONTACT.whatsapp)}`} target="_blank" rel="noreferrer">
              {CONTACT.whatsapp}
            </a>
          </div>
        </div>
        <p className="note">{t('ap_rdv_note')}</p>
      </div>
      <SiteFooter />
    </>
  )
}
