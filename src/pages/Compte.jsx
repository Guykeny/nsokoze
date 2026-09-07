import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import SiteHeader from '../components/SiteHeader.jsx'

export default function Compte() {
  const nav = useNavigate()
  const { t } = useLang()
  const [session, setSession] = useState(undefined)
  const [profil, setProfil] = useState(null)
  const [aUnSalon, setAUnSalon] = useState(false)

  const [mode, setMode] = useState('login') // login | signup
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [motdepasse, setMotdepasse] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfil(null); setAUnSalon(false); return }
    supabase
      .from('profils')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfil(data)
        if (data) { setNom(data.name); setTel(data.phone) }
      })
    supabase
      .from('salons')
      .select('id')
      .eq('owner_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setAUnSalon(Boolean(data)))
  }, [session])

  async function connexion(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email, password: motdepasse,
    })
    setBusy(false)
    if (err) setError(t('err_identifiants'))
  }

  async function inscription(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password: motdepasse,
      options: { data: { role: 'client' } },
    })
    if (err) {
      setBusy(false)
      setError(
        err.message.includes('already')
          ? t('err_compte_existant')
          : 'Création du compte impossible. ' + err.message
      )
      return
    }
    const { data: prof, error: errProf } = await supabase
      .from('profils')
      .insert({ user_id: data.user.id, name: nom, phone: tel })
      .select()
      .single()
    setBusy(false)
    if (errProf) {
      setError('Compte créé, mais profil incomplet : ' + errProf.message)
      return
    }
    setProfil(prof)
  }

  async function completerProfil(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profils')
      .upsert({ user_id: session.user.id, name: nom, phone: tel })
      .select()
      .single()
    setBusy(false)
    if (err) {
      setError('Enregistrement impossible. ' + err.message)
      return
    }
    setProfil(data)
  }

  async function deconnexion() {
    await supabase.auth.signOut()
    setNom(''); setTel(''); setEmail(''); setMotdepasse('')
  }

  if (session === undefined) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />{t('c_chargement')}</div>
        </div>
      </>
    )
  }

  // ----- Connecté -----
  if (session?.user) {
    return (
      <>
        <SiteHeader />
        <div className="page" style={{ maxWidth: 460 }}>
          <div className="carte-auth">
            {profil ? (
              <>
                <h1>{t('c_bonjour')} {profil.name.split(' ')[0]} 👋</h1>
                <div className="recap">
                  <div className="ligne-recap">
                    <span>{t('c_nom')}</span>
                    <span>{profil.name}</span>
                  </div>
                  <div className="ligne-recap">
                    <span>{t('c_tel2')}</span>
                    <span>{profil.phone}</span>
                  </div>
                  <div className="ligne-recap">
                    <span>Email</span>
                    <span>{session.user.email}</span>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => nav('/recherche')}>{t('c_trouver')}</button>
                </div>
                {aUnSalon && (
                  <div style={{ marginTop: 10 }}>
                    <Link to="/pro/agenda" className="btn btn-secondaire" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                      {t('c_espace_salon')}
                    </Link>
                  </div>
                )}
                <p style={{ textAlign: 'center', marginTop: 16 }}>
                  <button className="btn-lien" onClick={deconnexion}>{t('c_deconnexion')}</button>
                </p>
              </>
            ) : (
              <>
                <h1>{t('c_completer_titre')}</h1>
                <p className="sous-titre">
                  {t('c_completer_sous')}
                </p>
                <form onSubmit={completerProfil}>
                  <label htmlFor="cp-nom">{t('b_nom')}</label>
                  <input id="cp-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Diane N." autoComplete="name" />
                  <label htmlFor="cp-tel">{t('b_tel')}</label>
                  <input id="cp-tel" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+257 79 000 000" autoComplete="tel" />
                  {error && <p className="erreur">{error}</p>}
                  <div style={{ marginTop: 14 }}>
                    <button type="submit" disabled={busy || !nom || !tel}>
                      {busy ? t('b_instant') : t('c_enregistrer')}
                    </button>
                  </div>
                </form>
                <p style={{ textAlign: 'center', marginTop: 14 }}>
                  <button className="btn-lien" onClick={deconnexion}>{t('c_deconnexion')}</button>
                </p>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // ----- Pas connecté -----
  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 460 }}>
        <div className="carte-auth">
          <h1 style={{ textAlign: 'center' }}>{t('c_titre')}</h1>
          <p className="sous-titre" style={{ textAlign: 'center' }}>
            {t('c_sous')}
          </p>

          <div className="onglets onglets-vues" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className={`onglet ${mode === 'login' ? 'actif' : ''}`}
              onClick={() => { setMode('login'); setError(null) }}
            >
              {t('c_connexion')}
            </button>
            <button
              className={`onglet ${mode === 'signup' ? 'actif' : ''}`}
              onClick={() => { setMode('signup'); setError(null) }}
            >
              {t('c_creer')}
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={connexion}>
              <label htmlFor="lo-email">{t('b_email')}</label>
              <input id="lo-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <label htmlFor="lo-mdp">{t('b_mdp')}</label>
              <input id="lo-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="current-password" />
              {error && <p className="erreur">{error}</p>}
              <div style={{ marginTop: 16 }}>
                <button type="submit" disabled={busy || !email || !motdepasse}>
                  {busy ? t('b_instant') : t('b_connecter')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={inscription}>
              <label htmlFor="si-nom">{t('b_nom')}</label>
              <input id="si-nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Diane N." autoComplete="name" />
              <label htmlFor="si-tel">{t('b_tel')}</label>
              <input id="si-tel" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+257 79 000 000" autoComplete="tel" />
              <label htmlFor="si-email">{t('b_email')}</label>
              <input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <label htmlFor="si-mdp">{t('b_mdp')}</label>
              <input id="si-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="new-password" />
              <p className="aide-champ">{t('b_mdp_aide')}</p>
              {error && <p className="erreur">{error}</p>}
              <div style={{ marginTop: 14 }}>
                <button
                  type="submit"
                  disabled={busy || !nom || !tel || !email || motdepasse.length < 6}
                >
                  {busy ? t('b_instant') : t('c_creer')}
                </button>
              </div>
            </form>
          )}

          <p className="aide-champ" style={{ textAlign: 'center', marginTop: 16 }}>
            {t('c_pro_q')}{' '}
            <Link to="/pro">{t('c_pro_lien')}</Link>.
          </p>
        </div>
      </div>
    </>
  )
}
