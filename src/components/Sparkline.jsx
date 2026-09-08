/** Petit graphique d'évolution en aire, en SVG natif — pas de dépendance.
 *  data: [{ jour: 'YYYY-MM-DD', n: number }, ...] */
export default function Sparkline({ data, couleur = 'var(--noir)', hauteur = 90 }) {
  if (!data || data.length === 0) return null

  const largeur = 600
  const max = Math.max(1, ...data.map((d) => d.n))
  const pas = largeur / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = i * pas
    const y = hauteur - (d.n / max) * (hauteur - 8) - 4
    return [x, y]
  })

  const ligne = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const aire = `${ligne} L${largeur},${hauteur} L0,${hauteur} Z`

  const total = data.reduce((s, d) => s + d.n, 0)

  return (
    <div className="sparkline">
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} preserveAspectRatio="none" className="sparkline-svg">
        <path d={aire} fill={couleur} fillOpacity="0.12" />
        <path d={ligne} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="sparkline-legende">
        <span>{data[0].jour.slice(5).replace('-', '/')}</span>
        <span className="sparkline-total">{total} sur la période</span>
        <span>{data[data.length - 1].jour.slice(5).replace('-', '/')}</span>
      </div>
    </div>
  )
}
