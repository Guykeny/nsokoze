import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

/** true/false une fois vérifié ; undefined tant que la vérification est en cours. */
export function useEstAdmin() {
  const [estAdmin, setEstAdmin] = useState(undefined)

  useEffect(() => {
    let annule = false

    async function verifier(session) {
      if (!session?.user) {
        if (!annule) setEstAdmin(false)
        return
      }
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!annule) setEstAdmin(Boolean(data))
    }

    supabase.auth.getSession().then(({ data }) => verifier(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => verifier(session))

    return () => {
      annule = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return estAdmin
}
