import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Fonctions pures réexportées ici pour ne pas changer les imports existants
export {
  SLOT_STEP_MIN, WEEKDAYS, dureeLecture, slugify, formatBif, formatTime,
  telInternational, computeSlots, prochainCreneau,
} from './creneaux.js'

/** URL publique d'une photo stockée dans le bucket salon-photos. */
export function photoUrl(path) {
  return supabase.storage.from('salon-photos').getPublicUrl(path).data.publicUrl
}

/** URL publique d'une image d'article : chemin du bucket blog-photos,
 *  ou URL externe déjà complète (articles de démonstration). */
export function blogPhotoUrl(path) {
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from('blog-photos').getPublicUrl(path).data.publicUrl
}
