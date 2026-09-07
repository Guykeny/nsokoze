import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'

const IMAGE_COTE =
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=70'

const ACTIVITES = [
  { id: 'coiffure', titre: 'l_act1_t', detail: 'l_act1_d' },
  { id: 'esthetique', titre: 'l_act2_t', detail: 'l_act2_d' },
  { id: 'bien-etre', titre: 'l_act3_t', detail: 'l_act3_d' },
]

const LIEUX = [
  { id: false, titre: 'l_lieu1_t', detail: 'l_lieu1_d' },
  { id: true, titre: 'l_lieu2_t', detail: 'l_lieu2_d' },
]

function Fleche() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Login() {
  const nav = useNavigate()
  const { t } = useLang()
  // choix | activite | lieu | compte | connexion
  const [vue, setVue] = useState('choix')

  const [categorie, setCategorie] = useState(null)
  const [aDomicile, setADomicile] = useState(false)

  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [motdepasse, setMotdepasse] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function Progression({ etape }) {
    return (
      <div className="progression">
        <span className="prog-label">{t('l_etape', { n: etape })}</span>
        <div className="prog-piste">
          <div className="prog-barre" style={{ width: `${(etape / 3) * 100}%` }} />
        </div>
      </div>
    )
  }

  async function inscriptionPro(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signUp({
      email,
      password: motdepasse,
      options: {
        data: {
          role: 'pro',
          categorie,
          a_domicile: aDomicile,
          gerant_nom: nom,
          gerant_tel: tel,
        },
      },
    })
    setBusy(false)
    if (err) {
      setError(
        err.message.includes('already')
          ? t('err_compte_existant')
          : t('err_generique') + ' ' + err.message
      )
      return
    }
    nav('/pro/agenda')
  }

  async function connexion(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email, password: motdepasse,
    })
    setBusy(false)
    if (err) {
      setError(t('err_identifiants'))
      return
    }
    nav('/pro/agenda')
  }

  return (
    <>
      <SiteHeader />
      <div className="ecran-split">
        <div className="split-form">
          <div className="split-form-inner">

            {/* ----- Porte d'entrée ----- */}
            {vue === 'choix' && (
              <>
                <h1>{t('l_bienvenue')}</h1>
                <p className="sous-titre" style={{ textAlign: 'center' }}>
                  {t('l_sous')}
                </p>

                <button className="carte-grand-choix" onClick={() => setVue('activite')}>
                  <span className="icone-rond" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                      <path d="M8.5 8.5 20 20M8.5 15.5 20 4" />
                    </svg>
                  </span>
                  <span className="choix-textes">
                    <strong>{t('l_gerant_t')}</strong>
                    <span>{t('l_gerant_d')}</span>
                  </span>
                  <Fleche />
                </button>

                <button className="carte-grand-choix" onClick={() => nav('/')}>
                  <span className="icone-rond" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
                    </svg>
                  </span>
                  <span className="choix-textes">
                    <strong>{t('l_client_t')}</strong>
                    <span>{t('l_client_d')}</span>
                  </span>
                  <Fleche />
                </button>

                <div className="separateur">{t('l_ou')}</div>
                <button className="btn-secondaire" onClick={() => setVue('connexion')}>
                  {t('l_deja')}
                </button>
              </>
            )}

            {/* ----- Étape 1 : activité ----- */}
            {vue === 'activite' && (
              <>
                <Progression etape={1} />
                <h1>{t('l_activite_titre')}</h1>
                {ACTIVITES.map((a) => (
                  <button
                    key={a.id}
                    className="carte-grand-choix"
                    onClick={() => { setCategorie(a.id); setVue('lieu') }}
                  >
                    <span className="choix-textes">
                      <strong>{t(a.titre)}</strong>
                      <span>{t(a.detail)}</span>
                    </span>
                    <Fleche />
                  </button>
                ))}
                <button className="btn-lien" onClick={() => setVue('choix')}>{t('l_retour')}</button>
              </>
            )}

            {/* ----- Étape 2 : lieu ----- */}
            {vue === 'lieu' && (
              <>
                <Progression etape={2} />
                <h1>{t('l_lieu_titre')}</h1>
                {LIEUX.map((l) => (
                  <button
                    key={String(l.id)}
                    className="carte-grand-choix"
                    onClick={() => { setADomicile(l.id); setVue('compte') }}
                  >
                    <span className="choix-textes">
                      <strong>{t(l.titre)}</strong>
                      <span>{t(l.detail)}</span>
                    </span>
                    <Fleche />
                  </button>
                ))}
                <button className="btn-lien" onClick={() => setVue('activite')}>{t('l_retour')}</button>
              </>
            )}

            {/* ----- Étape 3 : compte gérant ----- */}
            {vue === 'compte' && (
              <>
                <Progression etape={3} />
                <h1>{t('l_compte_titre')}</h1>
                <form onSubmit={inscriptionPro}>
                  <label htmlFor="pg-nom">{t('l_nom_complet')}</label>
                  <input id="pg-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Keny Ndayizeye" autoComplete="name" />
                  <label htmlFor="pg-tel">{t('l_tel_wa')}</label>
                  <input id="pg-tel" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+257 79 000 000" autoComplete="tel" />
                  <label htmlFor="pg-email">{t('b_email')}</label>
                  <input id="pg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
                  <label htmlFor="pg-mdp">{t('b_mdp')}</label>
                  <input id="pg-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="new-password" />
                  <p className="aide-champ">{t('b_mdp_aide')}</p>
                  {error && <p className="erreur">{error}</p>}
                  <div style={{ marginTop: 16 }}>
                    <button
                      type="submit"
                      disabled={busy || !nom || !tel || !email || motdepasse.length < 6}
                    >
                      {busy ? t('b_instant') : t('l_creer_compte')}
                    </button>
                  </div>
                </form>
                <p style={{ marginTop: 14 }}>
                  <button className="btn-lien" onClick={() => setVue('lieu')}>{t('l_retour')}</button>
                </p>
              </>
            )}

            {/* ----- Connexion (pro existant) ----- */}
            {vue === 'connexion' && (
              <>
                <h1>{t('l_revoir')}</h1>
                <form onSubmit={connexion}>
                  <label htmlFor="co-email">{t('b_email')}</label>
                  <input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  <label htmlFor="co-mdp">{t('b_mdp')}</label>
                  <input id="co-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="current-password" />
                  {error && <p className="erreur">{error}</p>}
                  <div style={{ marginTop: 16 }}>
                    <button type="submit" disabled={busy || !email || !motdepasse}>
                      {busy ? t('b_instant') : t('b_connecter')}
                    </button>
                  </div>
                </form>
                <div className="separateur">{t('l_ou')}</div>
                <button className="btn-secondaire" onClick={() => setVue('choix')}>
                  {t('l_creer_un')}
                </button>
                <p className="aide-champ" style={{ textAlign: 'center', marginTop: 12 }}>
                  {t('l_cc')} <Link to="/compte">{t('c_titre')}</Link>.
                </p>
              </>
            )}
          </div>
        </div>
        <div
          className="split-image"
          style={{ backgroundImage: `url(${IMAGE_COTE})` }}
          aria-hidden="true"
        />
      </div>
    </>
  )
}
