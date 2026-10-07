import { describe, expect, it } from 'vitest'
import {
  computeSlots, prochainCreneau, formatBif, slugify, telInternational, dureeLecture,
} from './creneaux.js'
import { hhmmBuj, jourBuj } from './temps.js'

const JOUR = '2026-03-10'
const HEURES = [{ opens_at: '09:00:00', closes_at: '12:00:00' }]
const AVANT = new Date('2026-03-01T00:00:00Z') // « maintenant » bien avant le jour testé

describe('computeSlots', () => {
  it('propose un créneau toutes les 30 min dans les horaires (heure de Bujumbura)', () => {
    const slots = computeSlots(HEURES, [], JOUR, 60, AVANT)
    expect(slots.map(hhmmBuj)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00'])
  })

  it('exclut les créneaux qui chevauchent un RDV existant', () => {
    const occupe = [{ starts_at: '2026-03-10T08:00:00Z', ends_at: '2026-03-10T09:00:00Z' }] // 10:00–11:00
    const slots = computeSlots(HEURES, occupe, JOUR, 60, AVANT)
    expect(slots.map(hhmmBuj)).toEqual(['09:00', '11:00'])
  })

  it('n’affiche pas les créneaux déjà passés', () => {
    const maintenant = new Date('2026-03-10T08:15:00Z') // 10:15 à Bujumbura
    const slots = computeSlots(HEURES, [], JOUR, 30, maintenant)
    expect(slots.map(hhmmBuj)).toEqual(['10:30', '11:00', '11:30'])
  })

  it('ne déborde pas après la fermeture', () => {
    const slots = computeSlots(HEURES, [], JOUR, 150, AVANT)
    expect(slots.map(hhmmBuj)).toEqual(['09:00', '09:30'])
  })

  it('gère plusieurs plages (pause déjeuner)', () => {
    const heures = [
      { opens_at: '09:00:00', closes_at: '10:00:00' },
      { opens_at: '14:00:00', closes_at: '15:00:00' },
    ]
    const slots = computeSlots(heures, [], JOUR, 60, AVANT)
    expect(slots.map(hhmmBuj)).toEqual(['09:00', '14:00'])
  })
})

describe('prochainCreneau', () => {
  // mardi 10 mars 2026, 11:45 à Bujumbura
  const maintenant = new Date('2026-03-10T09:45:00Z')
  const heures = [
    { weekday: 2, opens_at: '09:00:00', closes_at: '12:00:00' }, // mardi
    { weekday: 4, opens_at: '08:00:00', closes_at: '17:00:00' }, // jeudi
  ]

  it('saute la fin de journée pleine et trouve le jeudi suivant', () => {
    const d = prochainCreneau(heures, [], 60, 7, maintenant)
    expect(jourBuj(d)).toBe('2026-03-12')
    expect(hhmmBuj(d)).toBe('08:00')
  })

  it('renvoie le créneau du jour s’il en reste un', () => {
    const a1115 = new Date('2026-03-10T09:15:00Z') // 11:15 à Bujumbura
    const d = prochainCreneau(heures, [], 15, 7, a1115)
    expect(jourBuj(d)).toBe('2026-03-10')
    expect(hhmmBuj(d)).toBe('11:30')
  })

  it('null si aucun horaire', () => {
    expect(prochainCreneau([], [], 30, 7, maintenant)).toBeNull()
  })
})

describe('utilitaires', () => {
  it('slugify retire accents et ponctuation', () => {
    expect(slugify('Chez Diane — Coiffure & Beauté !')).toBe('chez-diane-coiffure-beaute')
  })

  it('formatBif', () => {
    expect(formatBif(15000).replace(/\s/g, ' ')).toBe('15 000 BIF')
    expect(formatBif(null, 'Sur devis')).toBe('Sur devis')
  })

  it('telInternational ajoute l’indicatif du Burundi aux numéros à 8 chiffres', () => {
    expect(telInternational('79 00 00 00')).toBe('25779000000')
    expect(telInternational('+257 79 000 000')).toBe('25779000000')
    expect(telInternational('+32 470 12 34 56')).toBe('32470123456')
  })

  it('dureeLecture : au moins 1 minute', () => {
    expect(dureeLecture('')).toBe(1)
    expect(dureeLecture('mot '.repeat(600))).toBe(3)
  })
})
