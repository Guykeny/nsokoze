import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { supabase, WEEKDAYS, formatBif, photoUrl } from '../lib/supabase'
import SiteHeader from '../components/SiteHeader.jsx'
import ProShell from '../components/ProShell.jsx'
import { useLang } from '../lib/i18n.jsx'
import { CartePosition } from '../components/Carte.jsx'
import { chercherAdresse, adresseDepuisCoords, extraireLieux } from '../lib/geo.js'

const JOURS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ServicesPage() {
  const nav = useNavigate()
  const { t, lang } = useLang()
  const joursSemaine = lang === 'en' ? JOURS_EN : WEEKDAYS
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [hours, setHours] = useState([])
  const [error, setError] = useState(null)

  const [name, setName] = useState('')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return nav('/pro')
      const { data } = await supabase
        .from('salons').select('*').eq('owner_id', user.id).maybeSingle()
      if (!data) return nav('/pro/agenda')
      setSalon(data)
      load(data.id)
    })
  }, [nav])

  async function load(salonId) {
    const [{ data: svc }, { data: h }] = await Promise.all([
      supabase.from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('name'),
      supabase.from('opening_hours').select('*').eq('salon_id', salonId).order('weekday'),
    ])
    setServices(svc ?? [])
    setHours(h ?? [])
  }

  async function addService(e) {
    e.preventDefault()
    setError(null)
    const { error: err } = await supabase.from('services').insert({
      salon_id: salon.id,
      name,
      duration_min: Number(duration),
      price_bif: price === '' ? null : Number(price),
    })
    if (err) return setError('Ajout impossible. ' + err.message)
    setName(''); setPrice('')
    load(salon.id)
  }

  async function removeService(id) {
    await supabase.from('services').update({ is_active: false }).eq('id', id)
    load(salon.id)
  }

  async function setDayHours(weekday, opens, closes) {
    setError(null)
    // Un seul créneau par jour au MVP : on remplace
    await supabase.from('opening_hours').delete()
      .eq('salon_id', salon.id).eq('weekday', weekday)
    if (opens && closes) {
      const { error: err } = await supabase.from('opening_hours').insert({
        salon_id: salon.id, weekday, opens_at: opens, closes_at: closes,
      })
      if (err) setError('Horaire invalide (la fermeture doit être après l’ouverture).')
    }
    load(salon.id)
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

  return (
    <ProShell salon={salon}>
      <h2 style={{ marginTop: 8 }}>{t('s_pres_titre')}</h2>
      <p className="sous-titre">
        {t('s_pres_sous')}
      </p>
      <Presentation salon={salon} onSaved={setSalon} />

      <h2>{t('s_photos_titre')}</h2>
      <p className="sous-titre">
        {t('s_photos_sous')}
      </p>
      <PhotosSalon salon={salon} onSaved={setSalon} />

      <h2>{t('s_services_titre')}</h2>
      {services.length === 0 && (
        <div className="vide">
          {t('s_services_vide')}
        </div>
      )}
      {services.map((s) => (
        <div key={s.id} className="carte ligne">
          <span style={{ flex: 2 }}>
            <strong>{s.name}</strong>
            <span className="sous-titre"> · {s.duration_min} {t('b_min')} · {formatBif(s.price_bif, t('sur_devis'))}</span>
          </span>
          <button className="btn-lien" onClick={() => removeService(s.id)}>{t('s_retirer')}</button>
        </div>
      ))}

      <form className="carte" onSubmit={addService}>
        <h3 style={{ marginBottom: 0 }}>{t('s_ajout_service')}</h3>
        <label htmlFor="svc-nom">{t('s_nom_service')}</label>
        <input id="svc-nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tresses box braids" />
        <div className="ligne">
          <div>
            <label htmlFor="svc-duree">{t('s_duree')}</label>
            <input id="svc-duree" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label htmlFor="svc-prix">{t('s_prix')}</label>
            <input id="svc-prix" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('s_prix_ph')} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={!name}>{t('s_ajouter_btn')}</button>
        </div>
      </form>

      <h2>{t('s_horaires_titre')}</h2>
      <p className="sous-titre">{t('s_horaires_sous')}</p>
      {joursSemaine.map((label, weekday) => {
        const h = hours.find((x) => x.weekday === weekday)
        return (
          <DayRow
            key={weekday}
            label={label}
            opens={h?.opens_at?.slice(0, 5) ?? ''}
            closes={h?.closes_at?.slice(0, 5) ?? ''}
            onSave={(o, c) => setDayHours(weekday, o, c)}
          />
        )
      })}
      {error && <p className="erreur">{error}</p>}

      <h2>{t('s_adresse_titre')}</h2>
      <p className="sous-titre">
        {t('s_adresse_sous')}
      </p>
      <AdresseCarte salon={salon} onSaved={setSalon} />
    </ProShell>
  )
}

const MAX_PHOTOS = 6
const MAX_TAILLE_MO = 5

function PhotosSalon({ salon, onSaved }) {
  const { t } = useLang()
  const fichierRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const photos = Array.isArray(salon.photos) ? salon.photos : []

  async function majPhotos(nouvelles) {
    const { data, error } = await supabase
      .from('salons')
      .update({ photos: nouvelles })
      .eq('id', salon.id)
      .select()
      .single()
    if (error) throw error
    onSaved(data)
  }

  async function ajouter(e) {
    const fichiers = Array.from(e.target.files ?? [])
    e.target.value = '' // permet de re-choisir le même fichier
    if (fichiers.length === 0) return
    setErr(null)

    const restants = MAX_PHOTOS - photos.length
    if (restants <= 0) {
      setErr(`Maximum ${MAX_PHOTOS} photos. Supprimez-en une d’abord.`)
      return
    }

    setBusy(true)
    const chemins = []
    try {
      for (const f of fichiers.slice(0, restants)) {
        if (!f.type.startsWith('image/')) {
          throw new Error(`« ${f.name} » n’est pas une image.`)
        }
        if (f.size > MAX_TAILLE_MO * 1024 * 1024) {
          throw new Error(`« ${f.name} » dépasse ${MAX_TAILLE_MO} Mo. Réduisez la photo.`)
        }
        const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
        const chemin = `${salon.owner_id}/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage
          .from('salon-photos')
          .upload(chemin, f, { contentType: f.type, cacheControl: '31536000' })
        if (error) throw error
        chemins.push(chemin)
      }
      await majPhotos([...photos, ...chemins])
    } catch (ex) {
      setErr(
        String(ex.message ?? ex).includes('column')
          ? 'La base doit être mise à jour : exécutez la migration 004_photos.sql dans Supabase.'
          : 'Envoi impossible. ' + (ex.message ?? ex)
      )
    }
    setBusy(false)
  }

  async function supprimer(chemin) {
    setErr(null)
    setBusy(true)
    try {
      await supabase.storage.from('salon-photos').remove([chemin])
      await majPhotos(photos.filter((p) => p !== chemin))
    } catch (ex) {
      setErr('Suppression impossible. ' + (ex.message ?? ex))
    }
    setBusy(false)
  }

  async function mettreEnPremiere(chemin) {
    setErr(null)
    setBusy(true)
    try {
      await majPhotos([chemin, ...photos.filter((p) => p !== chemin)])
    } catch (ex) {
      setErr('Modification impossible. ' + (ex.message ?? ex))
    }
    setBusy(false)
  }

  return (
    <div className="carte">
      <div className="grille-photos">
        {photos.map((p, i) => (
          <div key={p} className="photo-mini">
            <img src={photoUrl(p)} alt={`Photo ${i + 1} du salon`} loading="lazy" />
            {i === 0 && <span className="badge-principale">{t('s_principale')}</span>}
            <div className="photo-actions">
              {i > 0 && (
                <button
                  type="button"
                  className="photo-btn"
                  title="Mettre en photo principale"
                  disabled={busy}
                  onClick={() => mettreEnPremiere(p)}
                >
                  ★
                </button>
              )}
              <button
                type="button"
                className="photo-btn"
                title="Supprimer la photo"
                disabled={busy}
                onClick={() => supprimer(p)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            className="btn-ajout-photo"
            disabled={busy}
            onClick={() => fichierRef.current?.click()}
          >
            {busy ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t('s_ajouter')}
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fichierRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={ajouter}
      />

      <p className="aide-champ">
        {t('s_photos_aide', { n: photos.length, max: MAX_PHOTOS, mo: MAX_TAILLE_MO })}
      </p>
      {err && <p className="erreur">{err}</p>}
    </div>
  )
}

function Presentation({ salon, onSaved }) {
  const { t } = useLang()
  const [texte, setTexte] = useState(salon.description ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const modifie = texte !== (salon.description ?? '')

  async function save() {
    setBusy(true)
    setMsg(null)
    setErr(null)
    const { data, error } = await supabase
      .from('salons')
      .update({ description: texte.trim() || null })
      .eq('id', salon.id)
      .select()
      .single()
    setBusy(false)
    if (error) {
      setErr('Enregistrement impossible. ' + error.message)
      return
    }
    onSaved(data)
    setMsg(t('s_pres_ok'))
  }

  return (
    <div className="carte">
      <label htmlFor="pres">{t('s_pres_label')}</label>
      <textarea
        id="pres"
        rows={5}
        maxLength={600}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Ex. Salon spécialisé en tresses et soins capillaires au cœur de Rohero. Box braids, nattes collées, défrisage… Accueil chaleureux, produits de qualité, sur rendez-vous uniquement."
      />
      <p className="aide-champ">{t('s_pres_car', { n: texte.length })}</p>
      {err && <p className="erreur">{err}</p>}
      {msg && <p className="aide-champ" style={{ color: 'var(--vert)' }}>{msg}</p>}
      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={busy || !modifie}>
          {busy ? t('b_instant') : t('s_pres_btn')}
        </button>
      </div>
    </div>
  )
}

function AdresseCarte({ salon, onSaved }) {
  const { t } = useLang()
  const [adresse, setAdresse] = useState(salon.adresse ?? '')
  const [ville, setVille] = useState(salon.ville ?? 'Bujumbura')
  const [quartier, setQuartier] = useState(salon.quartier ?? '')
  const [genres, setGenres] = useState(
    Array.isArray(salon.genres) ? salon.genres : ['femme', 'homme']
  )
  const [lat, setLat] = useState(salon.lat ?? null)
  const [lng, setLng] = useState(salon.lng ?? null)

  const [suggestions, setSuggestions] = useState(null)
  const [chercheEnCours, setChercheEnCours] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  function toggleGenre(g) {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  // Adresse tapée → propositions Nominatim → coordonnées
  async function chercher(e) {
    e?.preventDefault()
    if (!adresse.trim()) return
    setChercheEnCours(true)
    setErr(null)
    setSuggestions(null)
    try {
      const res = await chercherAdresse(`${adresse}, ${ville || 'Burundi'}`)
      setSuggestions(res)
      if (res.length === 0) {
        setErr('Adresse introuvable. Précisez (ex. « Avenue de France, Bujumbura ») ou cliquez directement sur la carte.')
      }
    } catch {
      setErr('Recherche impossible (vérifiez votre connexion).')
    }
    setChercheEnCours(false)
  }

  function choisirSuggestion(res) {
    const lieux = extraireLieux(res)
    setAdresse(lieux.adresse)
    if (lieux.quartier) setQuartier(lieux.quartier)
    if (lieux.ville) setVille(lieux.ville)
    setLat(Number(res.lat))
    setLng(Number(res.lon))
    setSuggestions(null)
  }

  // Clic sur la carte → coordonnées → adresse remplie automatiquement
  async function clicCarte(la, ln) {
    setLat(la)
    setLng(ln)
    setSuggestions(null)
    try {
      const res = await adresseDepuisCoords(la, ln)
      if (res) {
        const lieux = extraireLieux(res)
        setAdresse(lieux.adresse)
        if (lieux.quartier) setQuartier(lieux.quartier)
        if (lieux.ville) setVille(lieux.ville)
      }
    } catch {
      // hors ligne : on garde les coordonnées, l'adresse reste modifiable à la main
    }
  }

  function maPosition() {
    setErr(null)
    if (!navigator.geolocation) {
      setErr('La géolocalisation n’est pas disponible sur cet appareil.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => clicCarte(pos.coords.latitude, pos.coords.longitude),
      () => setErr('Position refusée. Autorisez la localisation ou cliquez sur la carte.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function save() {
    setBusy(true)
    setMsg(null)
    setErr(null)
    const { data, error } = await supabase
      .from('salons')
      .update({ adresse, ville, quartier, genres, lat, lng })
      .eq('id', salon.id)
      .select()
      .single()
    setBusy(false)
    if (error) {
      setErr(
        error.message.includes('column')
          ? 'La base doit être mise à jour : exécutez les migrations 002 et 003 dans Supabase.'
          : 'Enregistrement impossible. ' + error.message
      )
      return
    }
    onSaved(data)
    setMsg(t('s_adresse_ok'))
  }

  return (
    <div className="carte">
      <label htmlFor="adr-adresse">{t('s_adresse_label')}</label>
      <form className="champ-adresse" onSubmit={chercher}>
        <input
          id="adr-adresse"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Ex. Avenue de la Mission, Rohero"
        />
        <button type="submit" className="btn-secondaire btn-chercher" disabled={chercheEnCours || !adresse.trim()}>
          {chercheEnCours ? '…' : t('s_chercher')}
        </button>
      </form>

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((r) => (
            <button
              key={r.place_id}
              type="button"
              className="suggestion"
              onClick={() => choisirSuggestion(r)}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="ligne">
        <div>
          <label htmlFor="adr-ville">{t('s_ville')}</label>
          <input id="adr-ville" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Bujumbura" />
        </div>
        <div>
          <label htmlFor="adr-quartier">{t('d_quartier')}</label>
          <input id="adr-quartier" value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Rohero" />
        </div>
      </div>

      <label>{t('s_clientele')}</label>
      <div className="cases-genres">
        <label className="case-genre">
          <input
            type="checkbox"
            checked={genres.includes('femme')}
            onChange={() => toggleGenre('femme')}
          />
          {t('r_femme')}
        </label>
        <label className="case-genre">
          <input
            type="checkbox"
            checked={genres.includes('homme')}
            onChange={() => toggleGenre('homme')}
          />
          {t('r_homme')}
        </label>
      </div>

      <label>{t('s_position')}</label>
      <p className="aide-champ" style={{ margin: '0 0 8px' }}>
        {t('s_position_aide')}
      </p>
      <CartePosition lat={lat} lng={lng} onChange={clicCarte} />
      <div style={{ marginTop: 10 }}>
        <button type="button" className="btn-secondaire btn-pilule" onClick={maPosition}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
          {t('s_ma_position')}
        </button>
      </div>
      {lat != null && (
        <p className="aide-champ">
          {t('s_coords')} {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}

      {err && <p className="erreur">{err}</p>}
      {msg && <p className="aide-champ" style={{ color: 'var(--vert)' }}>{msg}</p>}
      <div style={{ marginTop: 14 }}>
        <button onClick={save} disabled={busy || genres.length === 0}>
          {busy ? t('b_instant') : t('s_adresse_btn')}
        </button>
      </div>
    </div>
  )
}

function DayRow({ label, opens, closes, onSave }) {
  const { t } = useLang()
  const [o, setO] = useState(opens)
  const [c, setC] = useState(closes)
  const changed = o !== opens || c !== closes
  const ferme = !opens && !closes
  return (
    <div className="carte ligne">
      <span style={{ flex: 1 }}>
        <strong>{label}</strong>
        {ferme && !changed && (
          <span className="sous-titre" style={{ display: 'block', fontSize: '0.8rem' }}>{t('s_ferme')}</span>
        )}
      </span>
      <input type="time" aria-label={`Ouverture ${label}`} value={o} onChange={(e) => setO(e.target.value)} />
      <input type="time" aria-label={`Fermeture ${label}`} value={c} onChange={(e) => setC(e.target.value)} />
      <button
        className="btn-lien"
        disabled={!changed}
        onClick={() => onSave(o, c)}
      >
        {t('d_enregistrer')}
      </button>
    </div>
  )
}
