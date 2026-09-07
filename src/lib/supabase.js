import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Créneaux proposés toutes les 30 min.
export const SLOT_STEP_MIN = 30

export const WEEKDAYS = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
]

/** URL publique d'une photo stockée dans le bucket salon-photos. */
export function photoUrl(path) {
  return supabase.storage.from('salon-photos').getPublicUrl(path).data.publicUrl
}

export function formatBif(n, devisLabel = 'Sur devis') {
  if (n == null) return devisLabel
  return new Intl.NumberFormat('fr-FR').format(n) + ' BIF'
}

export function formatTime(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Calcule les créneaux disponibles pour un salon, un service et une date.
 * @param {Array} hours    lignes opening_hours du jour choisi
 * @param {Array} occupied lignes occupied_slots du jour choisi
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {number} durationMin
 * @returns {Date[]} heures de début possibles
 */
export function computeSlots(hours, occupied, dateStr, durationMin) {
  const slots = []
  const now = new Date()
  const busy = occupied.map((o) => ({
    start: new Date(o.starts_at),
    end: new Date(o.ends_at),
  }))

  for (const h of hours) {
    const open = new Date(`${dateStr}T${h.opens_at}`)
    const close = new Date(`${dateStr}T${h.closes_at}`)
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
