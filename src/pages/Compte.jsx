import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, formatBif, formatTime, telInternational } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import { dateLocale } from '../lib/temps.js'
import { DELAI_ANNULATION_H } from '../lib/config.js'
import { invaliderSession } from '../lib/useSession.js'
import SiteHeader from '../components/SiteHeader.jsx'

const CHAMPS_MES_RDV =
  'id, starts_at, ends_at, status, services(name, price_bif), salons(name, slug, phone, quartier)'

const CLES_STATUT = {
  confirmed: 'st_confirmed',
  cancelled: 'st_cancelled',
  no_show: 'st_no_show',
  done: 'st_done',
}

/** Formulaire d'avis (note 1-5 + commentaire) pour un RDV passé. */
function FormAvis({ rdvId, onEnvoye }) {
  const { t } = useLang()
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function envoyer(e) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const { error } = await supabase.rpc('laisser_avis', {
      p_appointment_id: rdvId,
      p_note: note,
      p_commentaire: commentaire,
    })
    setBusy(false)
    if (error) { setErr(t('err_avis')); return }
    onEnvoye()
  }

  return (
    <form className="form-avis" onSubmit={envoyer}>
      <div className="choix-etoiles" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={note === n}
            aria-label={`${n}/5`}
            className={n <= note ? 'pleine' : ''}
            onClick={() => setNote(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder={t('c_avis_commentaire')}
        maxLength={1000}
        rows={3}
      />
      {err && <p className="erreur">{err}</p>}
      <button type="submit" disabled={busy || note === 0}>
        {busy ? t('b_instant') : t('c_envoyer')}
      </button>
    </form>
  )
}

export default function Compte() {
  const nav = useNavigate()
  const { t, locale } = useLang()
  useMeta({ titre: t('c_titre'), noindex: true })
  const [session, setSession] = useState(undefined)
  const [profil, setProfil] = useState(null)
  const [aUnSalon, setAUnSalon] = useState(false)

  const [rdvs, setRdvs] = useState([])
  const [avisDonnes, setAvisDonnes] = useState(() => new Set()) // appointment_id
  const [avisOuvert, setAvisOuvert] = useState(null)
  const [rdvErr, setRdvErr] = useState(null)

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
    chargerRdvs(session.user.id)
  }, [session])

  async function chargerRdvs(userId) {
    const [{ data: r }, { data: av }] = await Promise.all([
      supabase
        .from('appointments')
        .select(CHAMPS_MES_RDV)
        .eq('user_id', userId)
        .order('starts_at', { ascending: false })
        .limit(50),
      supabase.from('avis').select('appointment_id').eq('user_id', userId),
    ])
    setRdvs(r ?? [])
    setAvisDonnes(new Set((av ?? []).map((a) => a.appointment_id)))
  }

  async function annuler(id) {
    if (!window.confirm(t('c_annuler_confirm'))) return
    setRdvErr(null)
    const { error: err } = await supabase.rpc('cancel_my_appointment', { p_appointment_id: id })
    if (err) {
      setRdvErr(t('err_annulation', { h: DELAI_ANNULATION_H }))
      return
    }
    chargerRdvs(session.user.id)
  }

  async function supprimerCompte() {
    if (!window.confirm(t('c_supprimer_confirm'))) return
    setBusy(true)
    setError(null)
    // Photos du salon : dossier = id du compte dans le bucket
    const dossier = session.user.id
    const { data: fichiers } = await supabase.storage.from('salon-photos').list(dossier)
    if (fichiers?.length) {
      await supabase.storage
        .from('salon-photos')
        .remove(fichiers.map((f) => `${dossier}/${f.name}`))
    }
    const { error: err } = await supabase.rpc('delete_my_account')
    setBusy(false)
    if (err) {
      setError(t('err_generique') + ' ' + err.message)
      return
    }
    await supabase.auth.signOut()
    nav('/')
  }

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
    invaliderSession() // met à jour le prénom dans l’en-tête
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
    invaliderSession() // met à jour le prénom dans l’en-tête
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
    const maintenant = new Date()
    return (
      <>
        <SiteHeader />
        <div className="page" style={{ maxWidth: 460 }}>
          <div className="carte-auth">
            {profil ? (
              <>
                <h1>{t('c_bonjour')} {profil.name.split(' ')[0]}</h1>
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

          {/* ----- Mes rendez-vous ----- */}
          <h2 className="etape" style={{ marginTop: 28 }}>{t('c_mes_rdv')}</h2>
          {rdvErr && <p className="erreur">{rdvErr}</p>}
          {rdvs.length === 0 && <div className="vide">{t('c_aucun_rdv')}</div>}
          {[
            { titre: t('c_a_venir'), items: rdvs.filter((r) => new Date(r.starts_at) > maintenant).reverse() },
            { titre: t('c_passes'), items: rdvs.filter((r) => new Date(r.starts_at) <= maintenant) },
          ].map((g) => g.items.length > 0 && (
            <div key={g.titre}>
              <h3 className="entete-groupe">{g.titre}</h3>
              {g.items.map((r) => {
                const aVenir = new Date(r.starts_at) > maintenant
                const annulable =
                  aVenir && r.status === 'confirmed' &&
                  new Date(r.starts_at).getTime() - Date.now() > DELAI_ANNULATION_H * 3600000
                const peutNoter =
                  !aVenir && ['confirmed', 'done'].includes(r.status) && !avisDonnes.has(r.id)
                return (
                  <div key={r.id} className={`carte rdv ${r.status === 'cancelled' ? 'annule' : ''}`}>
                    <div className="heure">
                      {formatTime(r.starts_at)}
                      <span className="quand">
                        {dateLocale(r.starts_at, locale, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="detail">
                      <div className="nom">
                        {r.salons ? <Link to={`/s/${r.salons.slug}`}>{r.salons.name}</Link> : '—'}
                      </div>
                      <div className="meta">
                        {r.services?.name}
                        {r.services?.price_bif != null && ` · ${formatBif(r.services.price_bif, t('sur_devis'))}`}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span className={`badge ${r.status}`}>{t(CLES_STATUT[r.status] ?? 'st_passe')}</span>
                      </div>
                      <div className="actions-relance">
                        {aVenir && r.salons?.phone && (
                          <a className="btn-relance" href={`tel:+${telInternational(r.salons.phone)}`}>
                            {t('b_appeler')}
                          </a>
                        )}
                        {annulable && (
                          <button className="btn-relance" onClick={() => annuler(r.id)}>
                            {t('c_annuler')}
                          </button>
                        )}
                        {peutNoter && avisOuvert !== r.id && (
                          <button className="btn-relance" onClick={() => setAvisOuvert(r.id)}>
                            {t('c_laisser_avis')}
                          </button>
                        )}
                        {avisDonnes.has(r.id) && (
                          <span className="aide-champ">{t('c_avis_donne')}</span>
                        )}
                      </div>
                      {avisOuvert === r.id && (
                        <FormAvis
                          rdvId={r.id}
                          onEnvoye={() => {
                            setAvisOuvert(null)
                            setAvisDonnes((s) => new Set(s).add(r.id))
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* ----- Suppression du compte ----- */}
          <details className="zone-danger">
            <summary>{t('c_zone_danger')}</summary>
            <p className="aide-champ">{t('c_supprimer_texte')}</p>
            {error && <p className="erreur">{error}</p>}
            <button className="btn-danger" disabled={busy} onClick={supprimerCompte}>
              {t('c_supprimer')}
            </button>
          </details>
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
              <p className="aide-champ" style={{ textAlign: 'center' }}>
                <Link to="/mot-de-passe">{t('mdp_oublie')}</Link>
              </p>
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
