import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, formatTime, formatBif, slugify, telInternational } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import { useMeta } from '../lib/useMeta.js'
import { jourBuj, jourBujOffset, instantBuj, hhmmBuj, dateLocale } from '../lib/temps.js'
import { invaliderSession } from '../lib/useSession.js'
import SiteHeader from '../components/SiteHeader.jsx'
import ProShell from '../components/ProShell.jsx'

// Jour à Bujumbura (l'agenda suit l'heure du salon, pas celle du navigateur)
function dayStr(d) {
  return jourBuj(d)
}

function heureStr(iso) {
  return hhmmBuj(iso)
}

function dateLongue(d, locale) {
  return dateLocale(d, locale, { weekday: 'long', day: 'numeric', month: 'long' })
}

const NOTIF_DISPO = typeof window !== 'undefined' && 'Notification' in window

/** « hier », « il y a 5 jours », « il y a 3 semaines »… */
function depuis(iso, t) {
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (jours <= 0) return t('q_auj')
  if (jours === 1) return t('q_hier')
  if (jours < 14) return t('q_jours', { n: jours })
  if (jours < 60) return t('q_sem', { n: Math.round(jours / 7) })
  return t('q_mois', { n: Math.round(jours / 30) })
}

const CLES_STATUT = {
  cancelled: 'st_cancelled',
  no_show: 'st_no_show',
  done: 'st_done',
}

const CHAMPS_RDV =
  'id, service_id, starts_at, status, source, clients(name, phone), services(name, price_bif, duration_min)'

export default function Dashboard() {
  const nav = useNavigate()
  const { t, locale } = useLang()
  const [salon, setSalon] = useState(undefined) // undefined = chargement, null = à créer
  const [vue, setVue] = useState('jour')        // jour | avenir | historique
  const [day, setDay] = useState(new Date())
  const [appts, setAppts] = useState([])
  const [avenir, setAvenir] = useState([])
  const [historique, setHistorique] = useState([])
  const [services, setServices] = useState([])

  // Formulaire création salon
  const [sName, setSName] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [sQuartier, setSQuartier] = useState('')

  // Formulaire RDV (ajout ou reprogrammation)
  const [showAdd, setShowAdd] = useState(false)
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const [mService, setMService] = useState('')
  const [mDate, setMDate] = useState(dayStr(new Date()))
  const [mTime, setMTime] = useState('09:00')
  const [error, setError] = useState(null)
  const [copie, setCopie] = useState(false)
  const [alerte, setAlerte] = useState(null) // bandeau « nouveau RDV »
  const [notifOk, setNotifOk] = useState(NOTIF_DISPO && Notification.permission === 'granted')

  useMeta({ titre: t('p_agenda'), noindex: true })

  // Les rechargements déclenchés par le temps réel doivent voir le jour courant
  const rechargerRef = useRef(() => {})
  rechargerRef.current = () => { loadDay(); loadListes() }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return nav('/pro')
      const { data } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
      setSalon(data)
      if (data) {
        const { data: svc } = await supabase
          .from('services')
          .select('id, name, duration_min, price_bif')
          .eq('salon_id', data.id)
          .eq('is_active', true)
        setServices(svc ?? [])
      } else {
        // Pré-remplit avec les infos données à l'inscription pro
        const meta = user.user_metadata ?? {}
        if (meta.gerant_tel) setSPhone(meta.gerant_tel)
      }
    })
  }, [nav])

  useEffect(() => {
    if (!salon) return
    loadDay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon, day])

  useEffect(() => {
    if (!salon) return
    loadListes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon])

  // Temps réel : nouvelle réservation ou annulation par une cliente
  // (nécessite la migration 011 : table appointments dans supabase_realtime)
  useEffect(() => {
    if (!salon) return
    const canal = supabase
      .channel(`agenda-${salon.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `salon_id=eq.${salon.id}` },
        (payload) => {
          rechargerRef.current()
          const rdv = payload.new
          if (payload.eventType === 'INSERT' && rdv?.source === 'online') {
            const quand = `${dateLongue(rdv.starts_at, locale)} · ${formatTime(rdv.starts_at)}`
            const texte = t('d_nouveau_rdv', { quand })
            setAlerte(texte)
            if (NOTIF_DISPO && Notification.permission === 'granted' && document.hidden) {
              new Notification('Nsokoze', { body: texte, icon: '/icon-192.png' })
            }
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon])

  async function activerNotifications() {
    if (!NOTIF_DISPO) return
    const p = await Notification.requestPermission()
    setNotifOk(p === 'granted')
  }

  async function loadDay() {
    const d = dayStr(day)
    const { data } = await supabase
      .from('appointments')
      .select(CHAMPS_RDV)
      .eq('salon_id', salon.id)
      .gte('starts_at', instantBuj(d, '00:00').toISOString())
      .lte('starts_at', instantBuj(d, '23:59:59').toISOString())
      .order('starts_at')
    setAppts(data ?? [])
  }

  async function loadListes() {
    const maintenant = new Date().toISOString()
    const [{ data: av }, { data: hist }] = await Promise.all([
      supabase
        .from('appointments')
        .select(CHAMPS_RDV)
        .eq('salon_id', salon.id)
        .gte('starts_at', maintenant)
        .eq('status', 'confirmed')
        .order('starts_at')
        .limit(100),
      supabase
        .from('appointments')
        .select(CHAMPS_RDV)
        .eq('salon_id', salon.id)
        .lt('starts_at', maintenant)
        .order('starts_at', { ascending: false })
        .limit(30),
    ])
    setAvenir(av ?? [])
    setHistorique(hist ?? [])
  }

  async function createSalon(e) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const meta = user.user_metadata ?? {}
    const base = {
      owner_id: user.id,
      name: sName,
      slug: slugify(sName),
      phone: sPhone,
      quartier: sQuartier,
    }
    // Activité et lieu choisis à l'inscription pro (migration 006)
    const complet = { ...base }
    if (meta.categorie) complet.categorie = meta.categorie
    if (meta.a_domicile != null) complet.a_domicile = meta.a_domicile

    let { data, error: err } = await supabase
      .from('salons')
      .insert(complet)
      .select()
      .single()
    // Base pas encore migrée (colonnes absentes) : on réessaie sans
    if (err && err.message.includes('column')) {
      ;({ data, error: err } = await supabase
        .from('salons')
        .insert(base)
        .select()
        .single())
    }
    if (err) {
      setError(
        err.message.includes('slug')
          ? t('d_err_slug')
          : t('err_generique') + ' ' + err.message
      )
      return
    }
    setSalon(data)
    invaliderSession() // met à jour le prénom dans l’en-tête
  }

  async function addManual(e) {
    e.preventDefault()
    setError(null)
    const svc = services.find((s) => s.id === mService)
    if (!svc) return
    const starts = instantBuj(mDate, mTime)
    // Même RPC que les clientes : mêmes vérifications de conflit. Appelée par
    // le gérant, elle enregistre le RDV comme « manuel » (migration 011).
    const { error: err } = await supabase.rpc('book_appointment', {
      p_salon_id: salon.id,
      p_service_id: svc.id,
      p_starts_at: starts.toISOString(),
      p_client_name: mName,
      p_client_phone: mPhone,
    })
    if (err) {
      setError(
        err.message.includes('creneau_pris')
          ? t('d_err_chevauche')
          : err.message.includes('hors_horaires')
            ? t('d_err_ferme')
            : err.message.includes('creneau_passe')
              ? t('err_creneau_passe')
              : t('err_generique') + ' ' + err.message
      )
      return
    }
    setShowAdd(false)
    setMName(''); setMPhone('')
    loadDay()
    loadListes()
  }

  async function setStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    loadDay()
    loadListes()
  }

  async function copierLien(url) {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // clipboard indisponible (http) : le lien reste sélectionnable
    }
  }

  function ouvrirAjout() {
    setError(null)
    setMName(''); setMPhone(''); setMService('')
    setMDate(dayStr(day)); setMTime('09:00')
    setShowAdd(true)
  }

  /** Pré-remplit le formulaire avec un ancien RDV : même cliente, même
      prestation (donc même prix) — il ne reste qu'à choisir le créneau. */
  function reprogrammer(a) {
    setError(null)
    setMName(a.clients?.name ?? '')
    setMPhone(a.clients?.phone ?? '')
    setMService(services.some((s) => s.id === a.service_id) ? a.service_id : '')
    setMDate(jourBujOffset(1))
    setMTime(heureStr(a.starts_at))
    setShowAdd(true)
  }

  // Groupe les RDV à venir par jour
  const groupesAvenir = useMemo(() => {
    const groupes = []
    for (const a of avenir) {
      const d = dayStr(new Date(a.starts_at))
      const dernier = groupes[groupes.length - 1]
      if (dernier?.date === d) dernier.items.push(a)
      else groupes.push({ date: d, items: [a] })
    }
    return groupes
  }, [avenir])

  if (salon === undefined) {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />{t('r_chargement')}</div>
        </div>
      </>
    )
  }

  // ----- Onboarding : créer son salon -----
  if (salon === null) {
    return (
      <>
        <SiteHeader />
        <div className="page" style={{ maxWidth: 460 }}>
          <div className="carte-auth">
            <h1>{t('d_onb_titre')}</h1>
            <p className="sous-titre">
              {t('d_onb_sous')}
            </p>
            <form onSubmit={createSalon}>
              <label htmlFor="sn">{t('d_nom_salon')}</label>
              <input id="sn" value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Chez Diane Coiffure" />
              <label htmlFor="sp">{t('d_tel_salon')}</label>
              <input id="sp" type="tel" value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="+257 79 000 000" />
              <label htmlFor="sq">{t('d_quartier')}</label>
              <input id="sq" value={sQuartier} onChange={(e) => setSQuartier(e.target.value)} placeholder="Rohero, Bujumbura" />
              {sName && (
                <p className="aide-champ">
                  {t('d_lien_apercu')} nsokoze.bi/s/{slugify(sName)}
                </p>
              )}
              {error && <p className="erreur">{error}</p>}
              <div style={{ marginTop: 18 }}>
                <button type="submit" disabled={!sName || !sPhone}>{t('d_creer_page')}</button>
              </div>
            </form>
          </div>
        </div>
      </>
    )
  }

  // ----- Agenda -----
  const shareUrl = `${window.location.origin}/s/${salon.slug}`
  const waText = encodeURIComponent(
    t('d_wa_texte', { salon: salon.name, url: shareUrl })
  )
  const aujourdhuiStr = dayStr(new Date())
  const aujourdhui = dayStr(day) === aujourdhuiStr
  const nbAujourdhui = avenir.filter((a) => dayStr(new Date(a.starts_at)) === aujourdhuiStr).length
  const nbEnLigne = avenir.filter((a) => a.source === 'online').length

  /** Message WhatsApp de relance : même prestation, même prix. */
  function lienRelance(a) {
    const tel = telInternational(a.clients?.phone)
    const prix = a.services?.price_bif != null ? formatBif(a.services.price_bif, t('sur_devis')) : null
    const texte = t('d_wa_relance', {
      nom: a.clients?.name ?? '',
      salon: salon.name,
      service: a.services?.name ?? '',
      quand: depuis(a.starts_at, t),
      prix: prix ? t('d_wa_prix', { p: prix }) : t('d_wa_meme'),
      url: shareUrl,
    })
    return `https://wa.me/${tel}?text=${encodeURIComponent(texte)}`
  }

  /** Rappel WhatsApp pour un RDV d'aujourd'hui ou de demain (null sinon). */
  function lienRappel(a) {
    const jour = dayStr(new Date(a.starts_at))
    const quand =
      jour === aujourdhuiStr ? t('d_aujourdhui')
        : jour === jourBujOffset(1) ? t('d_demain')
          : null
    if (!quand || !a.clients?.phone || new Date(a.starts_at) <= new Date()) return null
    const texte = t('d_wa_rappel', {
      nom: a.clients.name ?? '',
      salon: salon.name,
      quand,
      heure: formatTime(a.starts_at),
      service: a.services?.name ?? '',
    })
    return `https://wa.me/${telInternational(a.clients.phone)}?text=${encodeURIComponent(texte)}`
  }

  function CarteRdv({ a, avecDate }) {
    const rappel = a.status === 'confirmed' ? lienRappel(a) : null
    return (
      <div className={`carte rdv ${a.status !== 'confirmed' ? 'annule' : ''}`}>
        <div className="heure">
          {formatTime(a.starts_at)}
          {avecDate && (
            <span className="quand">
              {dateLocale(a.starts_at, locale, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <div className="detail">
          <div className="nom">{a.clients?.name}</div>
          <div className="meta">
            {a.services?.name}
            {a.services?.price_bif != null && ` · ${formatBif(a.services.price_bif, t('sur_devis'))}`}
            {' · '}{a.clients?.phone}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {a.source === 'online' && <span className="badge online">{t('st_online')}</span>}
            {CLES_STATUT[a.status] && (
              <span className={`badge ${a.status}`}>{t(CLES_STATUT[a.status])}</span>
            )}
          </div>
          {rappel && (
            <div className="actions-relance">
              <a className="btn-relance whatsapp" href={rappel} target="_blank" rel="noreferrer">
                {t('d_rappel')}
              </a>
            </div>
          )}
        </div>
        {a.status === 'confirmed' && (
          <div className="actions">
            <button className="btn-lien" onClick={() => setStatus(a.id, 'done')}>{t('st_done')}</button>
            <button className="btn-lien" onClick={() => setStatus(a.id, 'cancelled')}>{t('d_act_cancel')}</button>
            <button className="btn-lien" onClick={() => setStatus(a.id, 'no_show')}>{t('st_no_show')}</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <ProShell salon={salon}>
      {alerte && (
        <div className="alerte-rdv" role="status">
          <span>{alerte}</span>
          <button className="btn-fermer" aria-label={t('d_fermer')} onClick={() => setAlerte(null)}>✕</button>
        </div>
      )}
      {NOTIF_DISPO && !notifOk && (
        <p className="aide-champ" style={{ textAlign: 'right', margin: '0 0 8px' }}>
          <button className="btn-lien" onClick={activerNotifications}>{t('d_notif_activer')}</button>
        </p>
      )}
      <div className="lien-partage">
        <p className="titre-partage">{t('d_lien_titre')}</p>
        <a className="url" href={shareUrl}>{shareUrl}</a>
        <div className="actions-partage">
          <button className="btn-pilule btn-copier" onClick={() => copierLien(shareUrl)}>
            {copie ? t('d_copie') : t('d_copier')}
          </button>
          <a
            className="btn btn-pilule btn-whatsapp"
            style={{ textDecoration: 'none' }}
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.1 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .4-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.6.8 1.9.9.3.2.5.2.5.4 0 .1 0 .6-.2 1Z" />
            </svg>
            {t('d_wa_partager')}
          </a>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="val">{avenir.length}</div>
          <div className="lib">{t('d_stat_avenir')}</div>
        </div>
        <div className="stat">
          <div className="val">{nbAujourdhui}</div>
          <div className="lib">{t('d_stat_auj')}</div>
        </div>
        <div className="stat">
          <div className="val">{nbEnLigne}</div>
          <div className="lib">{t('d_stat_ligne')}</div>
        </div>
      </div>

      <div className="onglets onglets-vues">
        <button
          className={`onglet ${vue === 'jour' ? 'actif' : ''}`}
          onClick={() => setVue('jour')}
        >
          {t('d_vue_jour')}
        </button>
        <button
          className={`onglet ${vue === 'avenir' ? 'actif' : ''}`}
          onClick={() => setVue('avenir')}
        >
          {t('d_vue_avenir')} ({avenir.length})
        </button>
        <button
          className={`onglet ${vue === 'historique' ? 'actif' : ''}`}
          onClick={() => setVue('historique')}
        >
          {t('d_vue_histo')}
        </button>
      </div>

      {/* ----- Vue par jour ----- */}
      {vue === 'jour' && (
        <>
          <div className="barre-jour">
            <button
              className="btn-secondaire"
              aria-label="Jour précédent"
              onClick={() => setDay(new Date(day.getTime() - 86400000))}
            >
              ←
            </button>
            <div>
              <div className="date-jour">{dateLongue(day, locale)}</div>
              {!aujourdhui && (
                <button className="btn-aujourdhui" onClick={() => setDay(new Date())}>
                  {t('d_revenir')}
                </button>
              )}
            </div>
            <button
              className="btn-secondaire"
              aria-label="Jour suivant"
              onClick={() => setDay(new Date(day.getTime() + 86400000))}
            >
              →
            </button>
          </div>

          {appts.length === 0 && (
            <div className="vide">
              {t('d_vide_jour')}
              <br />
              {t('d_vide_partagez')}
            </div>
          )}
          {appts.map((a) => <CarteRdv key={a.id} a={a} />)}
        </>
      )}

      {/* ----- Vue à venir ----- */}
      {vue === 'avenir' && (
        <>
          {avenir.length === 0 && (
            <div className="vide">
              {t('d_vide_avenir')}
              <br />
              {t('d_vide_wa')}
            </div>
          )}
          {groupesAvenir.map((g) => (
            <div key={g.date}>
              <h3 className="entete-groupe">
                {g.date === aujourdhuiStr
                  ? t('r_auj')
                  : dateLongue(instantBuj(g.date, '12:00'), locale)}
              </h3>
              {g.items.map((a) => <CarteRdv key={a.id} a={a} />)}
            </div>
          ))}
        </>
      )}

      {/* ----- Vue historique ----- */}
      {vue === 'historique' && (
        <>
          {historique.length === 0 && (
            <div className="vide">
              {t('d_vide_histo')}
            </div>
          )}
          {historique.map((a) => (
            <div key={a.id} className="carte rdv historique-rdv">
              <div className="heure">
                {formatTime(a.starts_at)}
                <span className="quand">{depuis(a.starts_at, t)}</span>
              </div>
              <div className="detail">
                <div className="nom">{a.clients?.name}</div>
                <div className="meta">
                  {a.services?.name}
                  {a.services?.price_bif != null && ` · ${formatBif(a.services.price_bif, t('sur_devis'))}`}
                  {' · '}
                  {dateLocale(a.starts_at, locale, { day: 'numeric', month: 'long' })}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CLES_STATUT[a.status] ? (
                    <span className={`badge ${a.status}`}>{t(CLES_STATUT[a.status])}</span>
                  ) : (
                    <span className="badge online">{t('st_passe')}</span>
                  )}
                </div>
                <div className="actions-relance">
                  <button className="btn-relance" onClick={() => reprogrammer(a)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7" />
                      <path d="M3 4v4h4" />
                    </svg>
                    {t('d_refaire')}
                  </button>
                  {a.clients?.phone && (
                    <a
                      className="btn-relance whatsapp"
                      href={lienRelance(a)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.1 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .4-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.6.8 1.9.9.3.2.5.2.5.4 0 .1 0 .6-.2 1Z" />
                      </svg>
                      {t('d_proposer')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={ouvrirAjout}>{t('d_ajouter')}</button>
      </div>

      {showAdd && (
        <div className="voile" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="modale" role="dialog" aria-modal="true" aria-labelledby="titre-modale">
            <div className="modale-titre">
              <h2 id="titre-modale">{t('d_modal_titre')}</h2>
              <button className="btn-fermer" aria-label={t('d_fermer')} onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={addManual}>
              <label htmlFor="mn">{t('d_cliente')}</label>
              <input id="mn" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Nom" />
              <label htmlFor="mp">{t('c_tel2')}</label>
              <input id="mp" type="tel" value={mPhone} onChange={(e) => setMPhone(e.target.value)} placeholder="+257…" />
              <label htmlFor="ms">{t('b_service')}</label>
              <select id="ms" value={mService} onChange={(e) => setMService(e.target.value)}>
                <option value="">{t('d_choisir')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_min} min{s.price_bif != null ? ` · ${formatBif(s.price_bif, t('sur_devis'))}` : ''})
                  </option>
                ))}
              </select>
              <div className="ligne">
                <div>
                  <label htmlFor="md">{t('b_date')}</label>
                  <input
                    id="md" type="date" value={mDate}
                    min={aujourdhuiStr}
                    onChange={(e) => setMDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="mt">{t('b_heure')}</label>
                  <input id="mt" type="time" value={mTime} onChange={(e) => setMTime(e.target.value)} />
                </div>
              </div>
              {error && <p className="erreur">{error}</p>}
              <div className="ligne" style={{ marginTop: 16 }}>
                <button type="submit" disabled={!mName || !mPhone || !mService}>{t('d_enregistrer')}</button>
                <button type="button" className="btn-secondaire" onClick={() => setShowAdd(false)}>{t('d_act_cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProShell>
  )
}
