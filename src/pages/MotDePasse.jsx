import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import SiteHeader from '../components/SiteHeader.jsx'

/**
 * Deux étapes sur la même URL (/mot-de-passe) :
 *  1. demande : l'utilisateur saisit son email → Supabase envoie un lien ;
 *  2. le lien ramène ici avec une session « recovery » → nouveau mot de passe.
 * Dans Supabase > Authentication > URL Configuration, ajoutez
 * https://<votre-domaine>/mot-de-passe aux « Redirect URLs ».
 */
export default function MotDePasse() {
  const nav = useNavigate()
  const { t } = useLang()
  useMeta({ titre: t('mdp_titre'), noindex: true })

  const [recuperation, setRecuperation] = useState(
    () => window.location.hash.includes('type=recovery')
  )
  const [email, setEmail] = useState('')
  const [motdepasse, setMotdepasse] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [fini, setFini] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'PASSWORD_RECOVERY') setRecuperation(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function demander(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mot-de-passe`,
    })
    setBusy(false)
    if (err) { setError(t('err_generique') + ' ' + err.message); return }
    setEnvoye(true)
  }

  async function changer(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password: motdepasse })
    setBusy(false)
    if (err) { setError(t('err_generique') + ' ' + err.message); return }
    setFini(true)
  }

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 460 }}>
        <div className="carte-auth">
          {fini ? (
            <>
              <h1>{t('mdp_ok')}</h1>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => nav('/compte')}>{t('mdp_continuer')}</button>
              </div>
            </>
          ) : recuperation ? (
            <>
              <h1>{t('mdp_nouveau_titre')}</h1>
              <form onSubmit={changer}>
                <label htmlFor="mdp-nouveau">{t('mdp_nouveau')}</label>
                <input
                  id="mdp-nouveau" type="password" value={motdepasse}
                  onChange={(e) => setMotdepasse(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="aide-champ">{t('b_mdp_aide')}</p>
                {error && <p className="erreur">{error}</p>}
                <div style={{ marginTop: 14 }}>
                  <button type="submit" disabled={busy || motdepasse.length < 6}>
                    {busy ? t('b_instant') : t('mdp_valider')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1>{t('mdp_titre')}</h1>
              <p className="sous-titre">{t('mdp_sous')}</p>
              {envoye ? (
                <p className="note">{t('mdp_envoye')}</p>
              ) : (
                <form onSubmit={demander}>
                  <label htmlFor="mdp-email">{t('b_email')}</label>
                  <input
                    id="mdp-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {error && <p className="erreur">{error}</p>}
                  <div style={{ marginTop: 14 }}>
                    <button type="submit" disabled={busy || !email}>
                      {busy ? t('b_instant') : t('mdp_envoyer')}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
