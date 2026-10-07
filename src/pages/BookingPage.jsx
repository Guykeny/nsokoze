import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  supabase, computeSlots, formatBif, formatTime, photoUrl, telInternational,
} from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import {
  jourBuj, jourBujOffset, instantBuj, jourSemaine, dateLocale, dateDuJour, ajouterJours,
} from '../lib/temps.js'
import { invaliderSession } from '../lib/useSession.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { CarteSalons } from '../components/Carte.jsx'

// code d'erreur RPC → clé de traduction
const CODES_ERREUR = {
  creneau_pris: 'err_creneau_pris',
  creneau_passe: 'err_creneau_passe',
  hors_horaires: 'err_hors_horaires',
  nom_invalide: 'err_nom',
  telephone_invalide: 'err_tel',
  service_introuvable: 'err_service',
  trop_de_rdv: 'err_trop_de_rdv',
  profil_incomplet: 'err_profil_incomplet',
  connexion_requise: 'err_connexion_requise',
}

const HORIZON = 14 // jours proposés à la réservation

// Lundi → dimanche, ordre d'affichage des horaires
const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0]
// Un dimanche quelconque : + n jours = nom du jour n dans la langue choisie
const DIMANCHE_REF = '2024-01-07'

function todayStr(offset = 0) {
  return jourBujOffset(offset)
}

function Etoiles({ note }) {
  const pleine = Math.round(note)
  return (
    <span className="etoiles" aria-label={`${note}/5`}>
      {'★★★★★'.slice(0, pleine)}
      <span className="etoiles-vides">{'★★★★★'.slice(pleine)}</span>
    </span>
  )
}

function initiales(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatDateLongue(d, locale) {
  return dateLocale(d, locale, { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateCourte(d, locale) {
  return dateLocale(d, locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function BookingPage() {
  const { slug } = useParams()
  const { t, locale } = useLang()
  const [params] = useSearchParams()
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [hours, setHours] = useState([])       // opening_hours du salon
  const [occupied, setOccupied] = useState([]) // créneaux pris sur l'horizon
  const [pret, setPret] = useState(false)      // horaires + occupations chargés
  const [notFound, setNotFound] = useState(false)
  const [avis, setAvis] = useState([])
  const [noteSalon, setNoteSalon] = useState(null) // { moyenne, nb }

  const [serviceId, setServiceId] = useState(null)
  // Date pré-sélectionnée depuis la recherche (?date=YYYY-MM-DD), si valide
  const [date, setDate] = useState(() => {
    const d = params.get('date')
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= todayStr() && d <= todayStr(HORIZON - 1)) {
      return d
    }
    return todayStr()
  })
  const [slot, setSlot] = useState(null)

  // ----- Compte client -----
  const [session, setSession] = useState(undefined) // undefined = en cours
  const [profil, setProfil] = useState(null)
  const [authMode, setAuthMode] = useState('signup') // signup | login
  const [email, setEmail] = useState('')
  const [motdepasse, setMotdepasse] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authErr, setAuthErr] = useState(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const refDates = useRef(null)
  const refForm = useRef(null)

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  )

  const jours = useMemo(
    () => Array.from({ length: HORIZON }, (_, i) => todayStr(i)),
    []
  )

  useEffect(() => {
    supabase
      .from('salons')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return setNotFound(true)
        setSalon(data)
        const { data: svc } = await supabase
          .from('services')
          .select('id, name, duration_min, price_bif')
          .eq('salon_id', data.id)
          .eq('is_active', true)
          .order('name')
        setServices(svc ?? [])
        // Un seul service ? On le sélectionne d'office : une étape de moins.
        if (svc?.length === 1) setServiceId(svc[0].id)

        // Avis (vues publiques de la migration 011 ; absentes avant = ignoré)
        const [{ data: av }, { data: note }] = await Promise.all([
          supabase
            .from('avis_publics')
            .select('id, auteur, note, commentaire, created_at')
            .eq('salon_id', data.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('salon_notes')
            .select('moyenne, nb')
            .eq('salon_id', data.id)
            .maybeSingle(),
        ])
        setAvis(av ?? [])
        setNoteSalon(note ?? null)
      })
  }, [slug])

  useMeta({
    titre: salon?.name,
    description: salon
      ? [salon.description, [salon.quartier, salon.ville].filter(Boolean).join(', ')]
          .filter(Boolean).join(' — ') || undefined
      : undefined,
    image: salon?.photos?.length ? photoUrl(salon.photos[0]) : undefined,
  })

  // Suit la session du compte client
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Charge le profil (nom + téléphone) du compte connecté
  useEffect(() => {
    if (!session?.user) { setProfil(null); return }
    supabase
      .from('profils')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfil(data)
        if (data) { setName(data.name); setPhone(data.phone) }
      })
  }, [session])

  // Une seule salve réseau pour TOUT l'horizon : horaires + créneaux pris.
  // Ensuite, changer de date est instantané (calcul local).
  useEffect(() => {
    if (!salon) return
    const debut = instantBuj(todayStr(0), '00:00').toISOString()
    const fin = instantBuj(todayStr(HORIZON - 1), '23:59:59').toISOString()
    Promise.all([
      supabase
        .from('opening_hours')
        .select('weekday, opens_at, closes_at')
        .eq('salon_id', salon.id),
      supabase
        .from('occupied_slots')
        .select('starts_at, ends_at')
        .eq('salon_id', salon.id)
        .gte('starts_at', debut)
        .lte('starts_at', fin),
    ]).then(([h, o]) => {
      setHours(h.data ?? [])
      setOccupied(o.data ?? [])
      setPret(true)
    })
  }, [salon, refresh])

  const joursOuverts = useMemo(
    () => new Set(hours.map((h) => h.weekday)),
    [hours]
  )

  function slotsPour(dateStr) {
    const weekday = jourSemaine(dateStr)
    const hsJour = hours.filter((h) => h.weekday === weekday)
    if (hsJour.length === 0) return []
    const occJour = occupied.filter((o) => jourBuj(o.starts_at) === dateStr)
    return computeSlots(hsJour, occJour, dateStr, service?.duration_min ?? 60)
  }

  // Créneaux du jour choisi : calcul local, aucun aller-retour réseau
  const slots = useMemo(
    () => (service && pret ? slotsPour(date) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service, pret, date, hours, occupied]
  )

  // Premier créneau libre sur tout l'horizon → bouton « Au plus tôt »
  const premier = useMemo(() => {
    if (!service || !pret) return null
    for (const d of jours) {
      const s = slotsPour(d)
      if (s.length > 0) return { date: d, slot: s[0] }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, pret, jours, hours, occupied])

  // La sélection change → on efface le créneau si la date change
  useEffect(() => { setSlot(null) }, [date, serviceId])

  // Défilement automatique vers l'étape suivante
  useEffect(() => {
    if (service && !slot) {
      setTimeout(() => refDates.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    }
  }, [service]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (slot) {
      setTimeout(() => refForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    }
  }, [slot])

  function auPlusTot() {
    if (!premier) return
    setDate(premier.date)
    // le setSlot doit passer après l'effet qui remet slot à null
    setTimeout(() => setSlot(premier.slot), 0)
  }

  // ----- Compte : connexion / inscription / profil -----

  async function connexion(e) {
    e.preventDefault()
    setAuthBusy(true)
    setAuthErr(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email, password: motdepasse,
    })
    setAuthBusy(false)
    if (err) setAuthErr(t('err_identifiants'))
  }

  async function inscription(e) {
    e.preventDefault()
    setAuthBusy(true)
    setAuthErr(null)
    const { data, error: err } = await supabase.auth.signUp({
      email, password: motdepasse,
    })
    if (err) {
      setAuthBusy(false)
      setAuthErr(
        err.message.includes('already')
          ? t('err_compte_existant')
          : t('err_generique') + ' ' + err.message
      )
      return
    }
    // Enregistre le profil (nom + téléphone) : plus jamais à retaper
    const { data: prof, error: errProf } = await supabase
      .from('profils')
      .insert({ user_id: data.user.id, name, phone })
      .select()
      .single()
    setAuthBusy(false)
    if (errProf) {
      setAuthErr('Compte créé, mais profil incomplet : ' + errProf.message)
      return
    }
    setProfil(prof)
    invaliderSession() // met à jour le prénom dans l’en-tête
  }

  async function enregistrerProfil(e) {
    e.preventDefault()
    setAuthBusy(true)
    setAuthErr(null)
    const { data, error: err } = await supabase
      .from('profils')
      .upsert({ user_id: session.user.id, name, phone })
      .select()
      .single()
    setAuthBusy(false)
    if (err) {
      setAuthErr(
        err.message.includes('relation')
          ? 'La base doit être mise à jour : exécutez la migration 005 dans Supabase.'
          : 'Enregistrement impossible. ' + err.message
      )
      return
    }
    setProfil(data)
    invaliderSession() // met à jour le prénom dans l’en-tête
  }

  async function changerCompte() {
    await supabase.auth.signOut()
    setProfil(null)
    setName(''); setPhone('')
    setEmail(''); setMotdepasse('')
  }

  async function reserver() {
    if (busy || !slot || !profil) return
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('book_appointment', {
      p_salon_id: salon.id,
      p_service_id: serviceId,
      p_starts_at: slot.toISOString(),
      p_client_name: profil.name,
      p_client_phone: profil.phone,
    })
    setBusy(false)
    if (err) {
      const code = Object.keys(CODES_ERREUR).find((k) => err.message.includes(k))
      if (err.message.includes('permission denied')) {
        setError(t('err_connexion_requise'))
      } else {
        setError(code ? t(CODES_ERREUR[code]) : t('err_generique'))
      }
      if (code === 'creneau_pris') {
        setSlot(null)
        setRefresh((r) => r + 1)
      }
      return
    }
    setDone(data)
    setRefresh((r) => r + 1)
  }

  if (notFound) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>{t('b_introuvable')}</h1>
          <p className="sous-titre">{t('b_verif_lien')}</p>
        </div>
      </>
    )
  }

  if (!salon) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />{t('r_chargement')}</div>
        </div>
      </>
    )
  }

  if (done) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="succes">
            <span className="check-rond" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4.5 12.5 5 5 10-11" />
              </svg>
            </span>
            <h2>{t('b_confirme')}</h2>
            <p className="sous-titre" style={{ margin: 0 }}>
              {t('b_avite', { salon: salon.name })}
            </p>
            <div className="recap">
              <div className="ligne-recap">
                <span>{t('b_service')}</span>
                <span>{done.service}</span>
              </div>
              <div className="ligne-recap">
                <span>{t('b_date')}</span>
                <span>{formatDateLongue(done.starts_at, locale)}</span>
              </div>
              <div className="ligne-recap">
                <span>{t('b_heure')}</span>
                <span>{formatTime(done.starts_at)}</span>
              </div>
              <div className="ligne-recap">
                <span>{t('b_salon')}</span>
                <span>{salon.name}{salon.quartier ? ` — ${salon.quartier}` : ''}</span>
              </div>
            </div>
            <p className="note">{t('b_empechement', { tel: salon.phone })}</p>
          </div>
          <Link to="/compte" className="btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
            {t('b_voir_mes_rdv')}
          </Link>
          <button
            className="btn-secondaire"
            onClick={() => { setDone(null); setSlot(null) }}
          >
            {t('b_autre_rdv')}
          </button>
        </div>
      </>
    )
  }

  const etape3Prete = Boolean(session?.user && profil)

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ paddingBottom: slot ? 120 : undefined }}>
        <div className="carte" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="avatar grand" aria-hidden="true">{initiales(salon.name)}</span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.45rem', marginBottom: 2 }}>{salon.name}</h1>
            <p className="sous-titre" style={{ margin: 0 }}>
              {[salon.adresse ?? salon.quartier, salon.ville].filter(Boolean).join(', ')}
              {salon.description ? ` — ${salon.description}` : ''}
            </p>
            {noteSalon && (
              <p className="note-salon">
                <Etoiles note={noteSalon.moyenne} /> {noteSalon.moyenne}
                <span> · {t('b_nb_avis', { n: noteSalon.nb })}</span>
              </p>
            )}
          </div>
        </div>

        <div className="actions-salon">
          <a className="btn btn-pilule btn-secondaire" href={`tel:+${telInternational(salon.phone)}`}>
            {t('b_appeler')}
          </a>
          <a
            className="btn btn-pilule btn-whatsapp"
            href={`https://wa.me/${telInternational(salon.phone)}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('b_whatsapp')}
          </a>
          {salon.lat != null && salon.lng != null && (
            <a
              className="btn btn-pilule btn-secondaire"
              // Simple lien « Maps URLs » de Google : gratuit, sans clé d'API.
              // Sur mobile, il ouvre directement l'application Google Maps.
              href={`https://www.google.com/maps/dir/?api=1&destination=${salon.lat}%2C${salon.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('b_itineraire')}
            </a>
          )}
        </div>

        {salon.photos?.length > 0 && (
          <div className="galerie-salon">
            {salon.photos.map((p, i) => (
              <img
                key={p}
                src={photoUrl(p)}
                alt={`${salon.name} — photo ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        )}

        <h2 className="etape">
          <span className="num-etape">1</span>{t('b_e1')}
        </h2>
        <div className="liste-choix">
          {services.map((s) => (
            <button
              key={s.id}
              className={`choix ${s.id === serviceId ? 'actif' : ''}`}
              onClick={() => setServiceId(s.id)}
            >
              <span>
                {s.name}
                <span className="duree"> · {s.duration_min} {t('b_min')}</span>
              </span>
              <span className="prix">{formatBif(s.price_bif, t('sur_devis'))}</span>
            </button>
          ))}
          {services.length === 0 && (
            <div className="vide">{t('b_sans_services')}</div>
          )}
        </div>

        {service && (
          <div ref={refDates}>
            <h2 className="etape">
              <span className="num-etape">2</span>{t('b_e2')}
            </h2>

            {premier && (
              <button className="btn-plus-tot" onClick={auPlusTot}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
                </svg>
                {t('b_plus_tot')} {formatDateCourte(premier.slot, locale)} {t('b_a')} {formatTime(premier.slot)}
              </button>
            )}
            {pret && !premier && (
              <div className="vide">
                {t('b_aucun', { n: HORIZON, tel: salon.phone })}
              </div>
            )}

            <div className="chips-dates">
              {jours.map((d, i) => {
                const ferme = pret && !joursOuverts.has(jourSemaine(d))
                return (
                  <button
                    key={d}
                    className={`chip-date ${d === date ? 'actif' : ''}`}
                    disabled={ferme}
                    title={ferme ? 'Fermé ce jour' : ''}
                    onClick={() => setDate(d)}
                  >
                    <span className="cj">
                      {i === 0
                        ? t('b_auj')
                        : dateDuJour(d, locale, { weekday: 'short' })}
                    </span>
                    <span className="cn">{Number(d.slice(8, 10))}</span>
                    <span className="cj">
                      {dateDuJour(d, locale, { month: 'short' })}
                    </span>
                  </button>
                )
              })}
            </div>

            {!pret && (
              <div className="chargement"><span className="spinner" />{t('b_creneaux')}</div>
            )}

            <div className="grille-creneaux">
              {slots.map((t) => (
                <button
                  key={t.toISOString()}
                  className={slot?.getTime() === t.getTime() ? 'actif' : ''}
                  onClick={() => setSlot(t)}
                >
                  {formatTime(t)}
                </button>
              ))}
            </div>
            {pret && premier && slots.length === 0 && (
              <div className="vide">{t('b_aucun_jour')}</div>
            )}
          </div>
        )}

        {slot && (
          <div ref={refForm}>
            <h2 className="etape">
              <span className="num-etape">3</span>
              {etape3Prete ? t('b_e3_ok') : t('b_e3_auth')}
            </h2>

            {/* --- Pas connecté : connexion ou création de compte --- */}
            {session === null && (
              <div className="carte">
                <div className="onglets onglets-vues" style={{ margin: '0 0 12px' }}>
                  <button
                    className={`onglet ${authMode === 'signup' ? 'actif' : ''}`}
                    onClick={() => { setAuthMode('signup'); setAuthErr(null) }}
                  >
                    {t('b_tab_new')}
                  </button>
                  <button
                    className={`onglet ${authMode === 'login' ? 'actif' : ''}`}
                    onClick={() => { setAuthMode('login'); setAuthErr(null) }}
                  >
                    {t('b_tab_login')}
                  </button>
                </div>

                {authMode === 'signup' ? (
                  <form onSubmit={inscription}>
                    <p className="aide-champ" style={{ margin: 0 }}>{t('b_une_fois')}</p>
                    <label htmlFor="ins-nom">{t('b_nom')}</label>
                    <input id="ins-nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Diane N." autoComplete="name" />
                    <label htmlFor="ins-tel">{t('b_tel')}</label>
                    <input id="ins-tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+257 79 000 000" autoComplete="tel" />
                    <label htmlFor="ins-email">{t('b_email')}</label>
                    <input id="ins-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
                    <label htmlFor="ins-mdp">{t('b_mdp')}</label>
                    <input id="ins-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="new-password" />
                    <p className="aide-champ">{t('b_mdp_aide')}</p>
                    {authErr && <p className="erreur">{authErr}</p>}
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="submit"
                        disabled={authBusy || !name || !phone || !email || motdepasse.length < 6}
                      >
                        {authBusy ? t('b_instant') : t('b_creer')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={connexion}>
                    <label htmlFor="con-email">{t('b_email')}</label>
                    <input id="con-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                    <label htmlFor="con-mdp">{t('b_mdp')}</label>
                    <input id="con-mdp" type="password" value={motdepasse} onChange={(e) => setMotdepasse(e.target.value)} autoComplete="current-password" />
                    {authErr && <p className="erreur">{authErr}</p>}
                    <div style={{ marginTop: 12 }}>
                      <button type="submit" disabled={authBusy || !email || !motdepasse}>
                        {authBusy ? t('b_instant') : t('b_connecter')}
                      </button>
                    </div>
                    <p className="aide-champ" style={{ textAlign: 'center' }}>
                      <Link to="/mot-de-passe">{t('mdp_oublie')}</Link>
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* --- Connecté mais profil incomplet (ex. compte salon) --- */}
            {session?.user && !profil && (
              <form className="carte" onSubmit={enregistrerProfil}>
                <p className="aide-champ" style={{ margin: 0 }}>{t('b_completer')}</p>
                <label htmlFor="pr-nom">{t('b_nom')}</label>
                <input id="pr-nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Diane N." autoComplete="name" />
                <label htmlFor="pr-tel">{t('b_tel')}</label>
                <input id="pr-tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+257 79 000 000" autoComplete="tel" />
                {authErr && <p className="erreur">{authErr}</p>}
                <div style={{ marginTop: 12 }}>
                  <button type="submit" disabled={authBusy || !name || !phone}>
                    {authBusy ? t('b_instant') : t('b_enregistrer')}
                  </button>
                </div>
              </form>
            )}

            {/* --- Connecté avec profil : récapitulatif + confirmation --- */}
            {etape3Prete && (
              <>
                <p className="aide-champ" style={{ margin: '0 0 4px' }}>
                  {t('b_reserve_pour')} <strong>{profil.name}</strong> · {profil.phone}{' '}
                  <button type="button" className="btn-lien" onClick={changerCompte}>
                    {t('b_pas_vous')}
                  </button>
                </p>

                <div className="recap">
                  <div className="ligne-recap">
                    <span>{t('b_service')}</span>
                    <span>{service.name}</span>
                  </div>
                  <div className="ligne-recap">
                    <span>{t('b_date')}</span>
                    <span>{formatDateLongue(slot, locale)} {t('b_a')} {formatTime(slot)}</span>
                  </div>
                  <div className="ligne-recap">
                    <span>{t('b_duree')}</span>
                    <span>{service.duration_min} {t('b_min')}</span>
                  </div>
                  <div className="ligne-recap">
                    <span>{t('b_prix')}</span>
                    <span>{formatBif(service.price_bif, t('sur_devis'))}</span>
                  </div>
                </div>

                {error && <p className="erreur">{error}</p>}
                <button disabled={busy} onClick={reserver}>
                  {busy ? t('b_en_cours') : t('b_confirmer')}
                </button>
              </>
            )}
          </div>
        )}

        {/* ----- Infos pratiques : horaires, carte, avis ----- */}
        {pret && hours.length > 0 && (
          <section className="bloc-infos">
            <h2 className="etape">{t('b_horaires')}</h2>
            <div className="recap horaires-salon">
              {ORDRE_JOURS.map((wd) => {
                const plages = hours
                  .filter((h) => h.weekday === wd)
                  .sort((a, b) => a.opens_at.localeCompare(b.opens_at))
                return (
                  <div key={wd} className="ligne-recap">
                    <span>{dateDuJour(ajouterJours(DIMANCHE_REF, wd), locale, { weekday: 'long' })}</span>
                    <span>
                      {plages.length === 0
                        ? t('b_ferme')
                        : plages.map((p) => `${p.opens_at.slice(0, 5)}–${p.closes_at.slice(0, 5)}`).join(', ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {salon.lat != null && salon.lng != null && (
          <section className="bloc-infos">
            <CarteSalons salons={[salon]} />
          </section>
        )}

        <section className="bloc-infos">
          <h2 className="etape">{t('b_avis')}</h2>
          {avis.length === 0 && <div className="vide">{t('b_aucun_avis')}</div>}
          {avis.map((a) => (
            <div key={a.id} className="carte avis">
              <div className="avis-entete">
                <strong>{a.auteur}</strong>
                <Etoiles note={a.note} />
                <span className="avis-date">{formatDateCourte(a.created_at, locale)}</span>
              </div>
              {a.commentaire && <p>{a.commentaire}</p>}
            </div>
          ))}
        </section>
      </div>

      {/* Barre fixe : le récapitulatif et la confirmation suivent la cliente */}
      {slot && (
        <div className="barre-confirm">
          <div className="confirm-infos">
            <strong>{formatDateCourte(slot, locale)} · {formatTime(slot)}</strong>
            <span>{service.name} · {formatBif(service.price_bif, t('sur_devis'))}</span>
          </div>
          <button
            className="confirm-btn"
            disabled={busy}
            onClick={() => {
              if (!etape3Prete) {
                refForm.current?.scrollIntoView({ behavior: 'smooth' })
                return
              }
              reserver()
            }}
          >
            {busy ? '…' : etape3Prete ? t('b_confirm_court') : t('b_identifier')}
          </button>
        </div>
      )}
    </>
  )
}
