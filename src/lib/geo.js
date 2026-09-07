// Géocodage via Nominatim (OpenStreetMap) — usage léger, conforme à leur politique :
// requêtes déclenchées par l'utilisateur uniquement (pas d'autocomplétion à chaque touche).
const BASE = 'https://nominatim.openstreetmap.org'

export async function chercherAdresse(q) {
  const url =
    `${BASE}/search?format=jsonv2&limit=5&countrycodes=bi&addressdetails=1` +
    `&accept-language=fr&q=${encodeURIComponent(q)}`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) return []
  return r.json()
}

export async function adresseDepuisCoords(lat, lng) {
  const url =
    `${BASE}/reverse?format=jsonv2&addressdetails=1&accept-language=fr` +
    `&lat=${lat}&lon=${lng}`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) return null
  return r.json()
}

/** Extrait { adresse, quartier, ville } d'un résultat Nominatim. */
export function extraireLieux(res) {
  const a = res?.address ?? {}
  const ville =
    a.city || a.town || a.municipality || a.village || a.county || 'Bujumbura'
  const quartier = a.suburb || a.neighbourhood || a.quarter || a.hamlet || ''
  const rue = [a.road, a.house_number].filter(Boolean).join(' ')
  const adresse = rue || res?.name || [quartier, ville].filter(Boolean).join(', ')
  return { adresse, quartier, ville }
}
