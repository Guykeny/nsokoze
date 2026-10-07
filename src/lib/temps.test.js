import { describe, expect, it } from 'vitest'
import {
  jourBuj, ajouterJours, instantBuj, jourSemaine, heureBuj, hhmmBuj,
} from './temps.js'

describe('temps (heure de Bujumbura, UTC+2)', () => {
  it('jourBuj : après 22 h UTC, on est déjà le lendemain à Bujumbura', () => {
    // 2026-03-09 23:30 UTC = 2026-03-10 01:30 à Bujumbura
    expect(jourBuj(new Date('2026-03-09T23:30:00Z'))).toBe('2026-03-10')
    expect(jourBuj(new Date('2026-03-09T21:59:00Z'))).toBe('2026-03-09')
  })

  it('instantBuj : 09:00 à Bujumbura = 07:00 UTC', () => {
    expect(instantBuj('2026-03-10', '09:00').toISOString()).toBe('2026-03-10T07:00:00.000Z')
    expect(instantBuj('2026-03-10', '18:30:00').toISOString()).toBe('2026-03-10T16:30:00.000Z')
  })

  it('heureBuj / hhmmBuj', () => {
    const d = new Date('2026-03-10T07:05:00Z')
    expect(heureBuj(d)).toBe(9)
    expect(hhmmBuj(d)).toBe('09:05')
  })

  it('ajouterJours traverse les fins de mois et d’année', () => {
    expect(ajouterJours('2026-01-31', 1)).toBe('2026-02-01')
    expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01')
    expect(ajouterJours('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('jourSemaine : 0 = dimanche', () => {
    expect(jourSemaine('2024-01-07')).toBe(0)
    expect(jourSemaine('2026-10-07')).toBe(3) // mercredi
  })
})
