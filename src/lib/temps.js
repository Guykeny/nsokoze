// Toutes les dates « métier » (jours d'ouverture, créneaux, agenda) sont
// exprimées à l'heure de Bujumbura, quel que soit le fuseau du navigateur :
// une cliente de la diaspora doit voir les mêmes heures que le salon.
// Le Burundi est en UTC+2 toute l'année (pas d'heure d'été).
export const TZ = 'Africa/Bujumbura'
const DECALAGE = '+02:00'

const FORMAT_JOUR = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})

/** 'YYYY-MM-DD' du jour de cet instant à Bujumbura. */
export function jourBuj(d = new Date()) {
  return FORMAT_JOUR.format(new Date(d))
}

/** Aujourd'hui (+ offset jours) à Bujumbura, en 'YYYY-MM-DD'. */
export function jourBujOffset(offset = 0) {
  return ajouterJours(jourBuj(), offset)
}

/** Ajoute n jours à une date 'YYYY-MM-DD' (calcul calendaire, sans fuseau). */
export function ajouterJours(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Instant correspondant à une date + heure locales de Bujumbura. */
export function instantBuj(dateStr, heure = '00:00') {
  const h = heure.length === 5 ? `${heure}:00` : heure
  return new Date(`${dateStr}T${h}${DECALAGE}`)
}

/** Jour de la semaine (0 = dimanche) d'une date 'YYYY-MM-DD'. */
export function jourSemaine(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay()
}

/** Heure (0-23) de cet instant à Bujumbura. */
export function heureBuj(d) {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })
      .format(new Date(d))
  )
}

/** 'HH:MM' de cet instant à Bujumbura. */
export function hhmmBuj(d) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(d))
}

/** toLocaleDateString forcé à l'heure de Bujumbura. */
export function dateLocale(d, locale, options) {
  return new Date(d).toLocaleDateString(locale, { ...options, timeZone: TZ })
}

/** Date affichable d'un jour 'YYYY-MM-DD' (midi à Bujumbura, jamais décalé). */
export function dateDuJour(dateStr, locale, options) {
  return dateLocale(instantBuj(dateStr, '12:00'), locale, options)
}
