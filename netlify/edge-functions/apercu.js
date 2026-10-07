// Aperçus de liens (WhatsApp, Facebook, Telegram, Google…) pour /s/:slug et /blog/:slug.
// Ces robots ne lisent pas le JavaScript : sans cette fonction, chaque lien
// partagé afficherait le titre générique du site. On réécrit donc les balises
// <title> / og:* du HTML, uniquement pour les robots (aucun coût pour les visiteurs).
//
// Variables d'environnement Netlify nécessaires : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.

const ROBOTS = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|linkedinbot|discordbot|googlebot|bingbot|applebot|skypeuripreview/i

const echapper = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

async function lire(table, requete) {
  const base = Netlify.env.get('VITE_SUPABASE_URL')
  const cle = Netlify.env.get('VITE_SUPABASE_ANON_KEY')
  if (!base || !cle) return null
  const r = await fetch(`${base}/rest/v1/${table}?${requete}&limit=1`, {
    headers: { apikey: cle, Authorization: `Bearer ${cle}` },
  })
  if (!r.ok) return null
  const lignes = await r.json()
  return lignes[0] ?? null
}

function urlPhoto(chemin, bucket) {
  if (!chemin) return null
  if (/^https?:\/\//.test(chemin)) return chemin
  return `${Netlify.env.get('VITE_SUPABASE_URL')}/storage/v1/object/public/${bucket}/${chemin}`
}

async function infosPage(chemin) {
  const [, type, slug] = chemin.split('/')
  if (!slug) return null
  const s = encodeURIComponent(decodeURIComponent(slug))

  if (type === 's') {
    const salon = await lire('salons', `select=name,description,quartier,ville,photos&slug=eq.${s}`)
    if (!salon) return null
    const lieu = [salon.quartier, salon.ville].filter(Boolean).join(', ')
    return {
      titre: `${salon.name} — Réservez en ligne sur Nsokoze`,
      description: [salon.description, lieu].filter(Boolean).join(' — ') ||
        'Choisissez votre prestation et votre créneau, sans appeler.',
      image: urlPhoto(salon.photos?.[0], 'salon-photos'),
    }
  }

  if (type === 'blog') {
    const art = await lire('articles', `select=titre,extrait,image&publie=eq.true&slug=eq.${s}`)
    if (!art) return null
    return {
      titre: `${art.titre} — Nsokoze`,
      description: art.extrait || '',
      image: urlPhoto(art.image, 'blog-photos'),
    }
  }
  return null
}

function remplacerMeta(html, propriete, valeur) {
  const balise = `<meta property="${propriete}" content="${echapper(valeur)}" />`
  const motif = new RegExp(`<meta property="${propriete}"[^>]*>`)
  return motif.test(html) ? html.replace(motif, balise) : html.replace('</head>', `${balise}\n</head>`)
}

export default async (request, context) => {
  const reponse = await context.next()
  if (!ROBOTS.test(request.headers.get('user-agent') ?? '')) return reponse
  if (!(reponse.headers.get('content-type') ?? '').includes('text/html')) return reponse

  let infos = null
  try {
    infos = await infosPage(new URL(request.url).pathname)
  } catch {
    return reponse
  }
  if (!infos) return reponse

  let html = await reponse.text()
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${echapper(infos.titre)}</title>`)
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${echapper(infos.description)}" />`
  )
  html = remplacerMeta(html, 'og:title', infos.titre)
  html = remplacerMeta(html, 'og:description', infos.description)
  html = remplacerMeta(html, 'og:url', request.url)
  if (infos.image) html = remplacerMeta(html, 'og:image', infos.image)

  const entetes = new Headers(reponse.headers)
  entetes.delete('content-length')
  return new Response(html, { status: reponse.status, headers: entetes })
}

export const config = { path: ['/s/*', '/blog/*'] }
