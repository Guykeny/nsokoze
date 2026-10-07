// Génère les icônes PWA et l'image de partage (Open Graph) dans public/.
// À relancer seulement si le logo change :
//   npm install --no-save sharp && node scripts/icones.mjs
import sharp from 'sharp'

const PRUNE = '#7C2E62'
const OR = '#E8B04B'
const FOND = '#FAF3F6'

// Icône pleine (maskable) : le « N » reste dans la zone sûre centrale (80 %).
const icone = (taille) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${PRUNE}"/>
  <text x="256" y="345" font-family="Georgia, 'Times New Roman', serif" font-size="270"
        font-weight="700" fill="${OR}" text-anchor="middle">N</text>
</svg>`

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FOND}"/>
  <rect x="0" y="0" width="1200" height="14" fill="${OR}"/>
  <rect x="100" y="165" width="200" height="200" rx="44" fill="${PRUNE}"/>
  <text x="200" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="140"
        font-weight="700" fill="${OR}" text-anchor="middle">N</text>
  <text x="350" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="96"
        font-weight="700" fill="${PRUNE}">Nsokoze</text>
  <text x="352" y="340" font-family="Arial, Helvetica, sans-serif" font-size="38"
        fill="#241627">Réservez votre salon de beauté au Burundi</text>
  <text x="352" y="395" font-family="Arial, Helvetica, sans-serif" font-size="30"
        fill="#837087">En ligne, sans appeler, 24 h/24</text>
</svg>`

const sorties = [
  ['public/icon-192.png', icone(192)],
  ['public/icon-512.png', icone(512)],
  ['public/apple-touch-icon.png', icone(180)],
  ['public/og-image.png', og],
]

for (const [chemin, svg] of sorties) {
  await sharp(Buffer.from(svg)).png().toFile(chemin)
  console.log('✓', chemin)
}
