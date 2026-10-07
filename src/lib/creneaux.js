// Fonctions pures (sans accès réseau) : testables sans Supabase.
import { hhmmBuj, instantBuj, jourBuj, ajouterJours, jourSemaine } from './temps.js'

// Créneaux proposés toutes les 30 min.
export const SLOT_STEP_MIN = 30

export const WEEKDAYS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
]

const ACCENTS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Durée de lecture estimée (arrondie, minimum 1 min, ~200 mots/min). */
export function dureeLecture(texte) {
  const mots = (texte ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(mots / 200))
}

export function slugify(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD').replace(ACCENTS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatBif(n, devisLabel = 'Sur devis') {
  if (n == null) return devisLabel
  return new Intl.NumberFormat('fr-FR').format(n) + ' BIF'
}

/** Heure 'HH:MM' affichée à l'heure de Bujumbura. */
export function formatTime(d) {
  return hhmmBuj(d)
}

/** Numéro au format international pour wa.me / tel: (8 chiffres = Burundi). */
export function telInternational(tel) {
  let n = (tel ?? '').replace(/\D/g, '')
  if (n.length === 8) n = '257' + n
  return n
}

/**
 * Calcule les créneaux disponibles pour un salon, un service et une date.
 * @param {Array} hours    lignes opening_hours du jour choisi
 * @param {Array} occupied lignes occupied_slots du jour choisi
 * @param {string} dateStr 'YYYY-MM-DD' (jour à Bujumbura)
 * @param {number} durationMin
 * @param {Date} [now] instant de référence (injectable pour les tests)
 * @returns {Date[]} heures de début possibles
 */
export function computeSlots(hours, occupied, dateStr, durationMin, now = new Date()) {
  const slots = []
  const busy = occupied.map((o) => ({
    start: new Date(o.starts_at),
    end: new Date(o.ends_at),
  }))

  for (const h of hours) {
    // Horaires saisis par le salon = heure de Bujumbura
    const open = instantBuj(dateStr, h.opens_at)
    const close = instantBuj(dateStr, h.closes_at)
    for (
      let t = new Date(open);
      new Date(t.getTime() + durationMin * 60000) <= close;
      t = new Date(t.getTime() + SLOT_STEP_MIN * 60000)
    ) {
      const end = new Date(t.getTime() + durationMin * 60000)
      if (t <= now) continue
      const overlaps = busy.some((b) => t < b.end && end > b.start)
      if (!overlaps) slots.push(new Date(t))
    }
  }
  return slots
}

/**
 * Premier créneau libre d'un salon sur les `horizon` prochains jours.
 * @param {Array} hours    toutes les lignes opening_hours du salon
 * @param {Array} occupied ses créneaux occupés sur la période
 * @returns {Date|null}
 */
export function prochainCreneau(hours, occupied, durationMin, horizon = 7, now = new Date()) {
  const aujourdhui = jourBuj(now)
  for (let i = 0; i < horizon; i++) {
    const d = ajouterJours(aujourdhui, i)
    const hsJour = hours.filter((h) => h.weekday === jourSemaine(d))
    if (hsJour.length === 0) continue
    const occJour = occupied.filter((o) => jourBuj(o.starts_at) === d)
    const slots = computeSlots(hsJour, occJour, d, durationMin, now)
    if (slots.length > 0) return slots[0]
  }
  return null
}
