// Génère dist/sitemap.xml (pages fixes + salons + articles publiés)
// et dist/robots.txt avec la bonne URL. Lancé après `vite build`.
//
// URL du site : SITE_URL, sinon URL (fournie par Netlify), sinon nsokoze.bi.
// Supabase : VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (variables d'env
// ou fichier .env). Sans accès à la base, seules les pages fixes sont listées.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { CATEGORIES } from '../src/lib/categories.js'

function lireEnv() {
  const env = { ...process.env }
  if (existsSync('.env')) {
    for (const ligne of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = lireEnv()
const SITE = (env.SITE_URL || env.URL || 'https://nsokoze.bi').replace(/\/$/, '')

async function lister(table, requete) {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) return []
  try {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?${requete}`, {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    return await r.json()
  } catch (e) {
    console.warn(`sitemap : ${table} ignoré (${e.message})`)
    return []
  }
}

const echapper = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const jour = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null)

const [salons, articles] = await Promise.all([
  lister('salons', 'select=slug,created_at'),
  lister('articles', 'select=slug,updated_at&publie=eq.true'),
])

const urls = [
  { loc: '/', priorite: '1.0' },
  { loc: '/recherche', priorite: '0.9' },
  { loc: '/blog', priorite: '0.7' },
  { loc: '/a-propos', priorite: '0.4' },
  { loc: '/legal/mentions-legales', priorite: '0.2' },
  { loc: '/legal/cgu', priorite: '0.2' },
  { loc: '/legal/confidentialite', priorite: '0.2' },
  ...CATEGORIES.map((c) => ({ loc: `/c/${c.slug}`, priorite: '0.8' })),
  ...salons.map((s) => ({ loc: `/s/${s.slug}`, maj: jour(s.created_at), priorite: '0.8' })),
  ...articles.map((a) => ({ loc: `/blog/${a.slug}`, maj: jour(a.updated_at), priorite: '0.6' })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${echapper(SITE + encodeURI(u.loc))}</loc>${u.maj ? `<lastmod>${u.maj}</lastmod>` : ''}<priority>${u.priorite}</priority></url>`).join('\n')}
</urlset>
`

writeFileSync('dist/sitemap.xml', xml)
writeFileSync(
  'dist/robots.txt',
  readFileSync('public/robots.txt', 'utf8').replace(/^Sitemap:.*$/m, `Sitemap: ${SITE}/sitemap.xml`)
)
console.log(`sitemap : ${urls.length} URL (${salons.length} salons, ${articles.length} articles) → ${SITE}`)
