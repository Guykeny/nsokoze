import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Remonte en haut de la page à chaque changement de page (clic sur un lien).
 *  - Lien avec ancre (/a-propos#contact) : défile jusqu'à l'élément visé.
 *  - Simple changement de filtre (?cat=…, ?q=…) : on ne bouge pas.
 *  - Bouton « Retour » du navigateur (POP) : on laisse le navigateur gérer.
 */
export default function RetourHaut() {
  const { pathname, hash } = useLocation()
  const type = useNavigationType()

  useEffect(() => {
    if (type === 'POP') return
    if (hash) {
      // La page cible vient d'être chargée à la demande : on attend son rendu
      const id = decodeURIComponent(hash.slice(1))
      let essais = 0
      const chercher = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView()
        else if (essais++ < 20) setTimeout(chercher, 50)
      }
      chercher()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, type])

  return null
}
