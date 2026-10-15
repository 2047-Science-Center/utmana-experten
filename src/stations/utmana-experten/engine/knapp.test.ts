import { describe, it, expect } from 'vitest'
import { interpretKnapp } from './knapp'

describe('interpretKnapp — arkadknappens dubbla roll', () => {
  it('vote: tillåtet val → registrerar platsens röst', () => {
    expect(
      interpretKnapp({ stepType: 'vote', plats: 2, knapp: 'ja', allowedVals: ['ja', 'nej', 'kanske'] }),
    ).toEqual({ kind: 'vote', plats: 2, val: 'ja' })
  })

  it('vote: val som inte erbjuds (kanske saknas) → ignorera', () => {
    expect(
      interpretKnapp({ stepType: 'vote', plats: 1, knapp: 'kanske', allowedVals: ['ja', 'nej'] }),
    ).toEqual({ kind: 'ignore' })
  })

  it('speak_round: aktiva platsens knapp = klar ▸ → turbyte (oavsett vilken knapp)', () => {
    expect(interpretKnapp({ stepType: 'speak_round', plats: 3, knapp: 'nej', activePlats: 3 })).toEqual({
      kind: 'turn-advance',
      plats: 3,
    })
    expect(interpretKnapp({ stepType: 'speak_round', plats: 3, knapp: 'ja', activePlats: 3 })).toEqual({
      kind: 'turn-advance',
      plats: 3,
    })
  })

  it('speak_round: en annan plats trycker → ignorera (bara den aktiva kan avsluta)', () => {
    expect(interpretKnapp({ stepType: 'speak_round', plats: 1, knapp: 'ja', activePlats: 3 })).toEqual({
      kind: 'ignore',
    })
  })

  it('annat steg (facit/reveal) → ignorera', () => {
    expect(interpretKnapp({ stepType: 'facit', plats: 1, knapp: 'ja' })).toEqual({ kind: 'ignore' })
    expect(interpretKnapp({ stepType: null, plats: 1, knapp: 'ja' })).toEqual({ kind: 'ignore' })
  })
})
