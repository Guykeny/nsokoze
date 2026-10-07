import { useState } from 'react'

const LARGEUR = 600
const HAUTEUR = 110
const MARGE_BAS = 1 // l'axe ; les dates sont en HTML sous le graphique
const EPAISSEUR_MAX = 14
const RAYON = 4

/** 'YYYY-MM-DD' → 'jj/mm' (format français) */
function jjmm(jour) {
  const [, m, j] = jour.split('-')
  return `${j}/${m}`
}

/** Colonne à bout arrondi (4px) et base carrée, posée sur la ligne de base. */
function cheminBarre(x, y, l, h) {
  const r = Math.min(RAYON, l / 2, h)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + l - r} Q${x + l},${y} ${x + l},${y + r} V${y + h} Z`
}

/**
 * Nombre par jour en colonnes, une seule série (pas de légende : le titre la nomme).
 * data : [{ jour: 'YYYY-MM-DD', n }]. Si tout vaut 0, on écrit une phrase au lieu
 * d'un graphique vide.
 */
export default function BarresJours({ data, libelle, vide }) {
  const [survol, setSurvol] = useState(null)
  const total = data.reduce((s, d) => s + d.n, 0)
  if (total === 0) return <p className="kpi-phrase">{vide}</p>

  const max = Math.max(...data.map((d) => d.n))
  const base = HAUTEUR - MARGE_BAS
  const pas = LARGEUR / data.length
  const epaisseur = Math.min(EPAISSEUR_MAX, pas - 2)
  const indexDates = [0, Math.floor((data.length - 1) / 2), data.length - 1]
  const actif = survol != null ? data[survol] : null

  return (
    <figure className="barres-jours">
      <div className="barres-zone">
        <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} role="img" aria-label={`${libelle} : ${total} au total`}>
          {/* graduation haute (valeur max, écrite en HTML au-dessus) */}
          <line x1="0" x2={LARGEUR} y1={8} y2={8} className="barres-grille" />
          <line x1="0" x2={LARGEUR} y1={base} y2={base} className="barres-axe" />

          {data.map((d, i) => {
            const h = d.n === 0 ? 0 : Math.max(3, (d.n / max) * (base - 8))
            const x = i * pas + (pas - epaisseur) / 2
            return (
              <g
                key={d.jour}
                tabIndex={0}
                className={`barre ${survol === i ? 'active' : ''}`}
                onPointerEnter={() => setSurvol(i)}
                onPointerLeave={() => setSurvol(null)}
                onFocus={() => setSurvol(i)}
                onBlur={() => setSurvol(null)}
              >
                {/* zone de survol : toute la colonne, plus large que la barre */}
                <rect x={i * pas} y="0" width={pas} height={base} fill="transparent" />
                {h > 0 && <path d={cheminBarre(x, base - h, epaisseur, h)} />}
              </g>
            )
          })}

        </svg>
        {/* Textes en HTML : taille fixe quelle que soit la largeur de l'écran */}
        <span className="barres-max">{max}</span>
        <div className="barres-dates">
          {indexDates.map((i) => <span key={i}>{jjmm(data[i].jour)}</span>)}
        </div>

        {actif && (
          <div
            className="barres-bulle"
            style={{ left: `${((survol + 0.5) / data.length) * 100}%` }}
            role="status"
          >
            <strong>{actif.n}</strong>
            <span>{jjmm(actif.jour)}</span>
          </div>
        )}
      </div>

      {/* Même données en tableau, pour les lecteurs d'écran */}
      <table className="visuellement-cache">
        <caption>{libelle}</caption>
        <thead><tr><th>Jour</th><th>Nombre</th></tr></thead>
        <tbody>
          {data.filter((d) => d.n > 0).map((d) => (
            <tr key={d.jour}><td>{jjmm(d.jour)}</td><td>{d.n}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
