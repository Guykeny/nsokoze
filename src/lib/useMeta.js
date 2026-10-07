import { useEffect } from 'react'

const TITRE_SITE = 'Nsokoze'
const DESCRIPTION_DEFAUT =
  'Réservez votre coiffeur ou salon de beauté au Burundi, en ligne et sans appeler.'

function poserMeta(attr, cle, valeur) {
  let el = document.head.querySelector(`meta[${attr}="${cle}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, cle)
    document.head.appendChild(el)
  }
  el.setAttribute('content', valeur)
}

function poserCanonique(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

/**
 * Titre, description et balises Open Graph de la page courante.
 * (Les aperçus WhatsApp/Facebook ne lisent pas le JavaScript : pour eux,
 * la fonction edge netlify/edge-functions/apercu.js réécrit le HTML.)
 */
export function useMeta({ titre, description, image, noindex = false } = {}) {
  useEffect(() => {
    const titreComplet = titre ? `${titre} — ${TITRE_SITE}` : `${TITRE_SITE} — Réservez votre salon`
    const desc = description || DESCRIPTION_DEFAUT
    const url = window.location.origin + window.location.pathname

    document.title = titreComplet
    poserMeta('name', 'description', desc)
    poserMeta('property', 'og:title', titreComplet)
    poserMeta('property', 'og:description', desc)
    poserMeta('property', 'og:url', url)
    poserMeta('property', 'og:image', image || `${window.location.origin}/og-image.png`)
    poserMeta('name', 'robots', noindex ? 'noindex' : 'index, follow')
    poserCanonique(url)
  }, [titre, description, image, noindex])
}
