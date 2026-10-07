import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Infos du compte connecté, mises en cache pour toute la visite :
// l'en-tête est remonté à chaque page, on évite de requêter à chaque fois.
let cache = { userId: null, infos: null }
const abonnes = new Set() // en-têtes montés, à prévenir quand le profil change

async function chargerInfos(user) {
  if (cache.userId === user.id && cache.infos) return cache.infos
  const [{ data: profil }, { data: salon }] = await Promise.all([
    supabase.from('profils').select('name').eq('user_id', user.id).maybeSingle(),
    supabase.from('salons').select('id').eq('owner_id', user.id).maybeSingle(),
  ])
  const meta = user.user_metadata ?? {}
  const nom = profil?.name || meta.gerant_nom || user.email?.split('@')[0] || ''
  const infos = { prenom: nom.trim().split(/\s+/)[0], aUnSalon: Boolean(salon) }
  cache = { userId: user.id, infos }
  return infos
}

/**
 * État de connexion pour l'en-tête :
 *   undefined = en cours de vérification, null = déconnecté,
 *   { prenom, email, aUnSalon } = connecté.
 */
export function useSession() {
  const [compte, setCompte] = useState(undefined)

  useEffect(() => {
    let actif = true
    async function maj(session) {
      if (!session?.user) {
        cache = { userId: null, infos: null }
        if (actif) setCompte(null)
        return
      }
      const infos = await chargerInfos(session.user)
      if (actif) setCompte({ ...infos, email: session.user.email })
    }
    const recharger = () => supabase.auth.getSession().then(({ data }) => maj(data.session))
    recharger()
    abonnes.add(recharger)
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === 'USER_UPDATED' || evt === 'SIGNED_IN') cache = { userId: null, infos: null }
      maj(session)
    })
    return () => {
      actif = false
      abonnes.delete(recharger)
      sub.subscription.unsubscribe()
    }
  }, [])

  return compte
}

/** À appeler après création du profil ou du salon : l'en-tête se met à jour. */
export function invaliderSession() {
  cache = { userId: null, infos: null }
  abonnes.forEach((f) => f())
}
