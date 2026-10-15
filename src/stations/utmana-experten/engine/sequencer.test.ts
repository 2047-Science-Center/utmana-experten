import { describe, it, expect } from 'vitest'
import {
  currentStep,
  isLastStep,
  isDone,
  nextIndex,
  stepsOfType,
  nextSeat,
  tally,
  attitydDelta,
} from './sequencer'
import type { Step, Vote, VoteStep } from './types'

const steps: Step[] = [
  { typ: 'present', contentId: 'c1' },
  { typ: 'vote', val: ['ja', 'nej', 'kanske'], matpunkt: 'fore' },
  { typ: 'speak_round', sekunder: 15 },
  { typ: 'vote', val: ['ja', 'nej'], matpunkt: 'efter' },
  { typ: 'reveal', kalla: 'delta' },
]

describe('sekvenserare — kör stegen i ordning', () => {
  it('currentStep/nextIndex går igenom listan och landar på klar', () => {
    let i = 0
    const visited: string[] = []
    while (!isDone(steps, i)) {
      visited.push(currentStep(steps, i)!.typ)
      i = nextIndex(steps, i)
    }
    expect(visited).toEqual(['present', 'vote', 'speak_round', 'vote', 'reveal'])
    expect(isDone(steps, i)).toBe(true)
  })

  it('isLastStep true bara på sista steget', () => {
    expect(isLastStep(steps, 0)).toBe(false)
    expect(isLastStep(steps, 4)).toBe(true)
    expect(isLastStep(steps, 5)).toBe(false)
  })

  it('nextIndex klampar vid slutet (ingen overflow)', () => {
    expect(nextIndex(steps, 4)).toBe(5)
    expect(nextIndex(steps, 5)).toBe(5)
  })

  it('stepsOfType hittar mätpunkterna', () => {
    const votes = stepsOfType<VoteStep>(steps, 'vote')
    expect(votes.map((v) => v.matpunkt)).toEqual(['fore', 'efter'])
  })

  it('tom lista är direkt klar', () => {
    expect(isDone([], 0)).toBe(true)
    expect(currentStep([], 0)).toBeNull()
  })
})

describe('nextSeat — turordning i en tänk-runda', () => {
  const seats = [1, 2, 3]
  it('0 → första platsen', () => expect(nextSeat(seats, 0)).toBe(1))
  it('mitt i → nästa', () => expect(nextSeat(seats, 2)).toBe(3))
  it('sista → null (runda slut)', () => expect(nextSeat(seats, 3)).toBeNull())
  it('en plats → direkt slut efter den', () => {
    expect(nextSeat([1], 0)).toBe(1)
    expect(nextSeat([1], 1)).toBeNull()
  })
  it('inga platser → null', () => expect(nextSeat([], 0)).toBeNull())
})

describe('attitydDelta — mätpunkten (före→efter)', () => {
  it('räknar platser som bytte åsikt', () => {
    const fore: Vote[] = [
      { plats: 1, val: 'ja' },
      { plats: 2, val: 'nej' },
      { plats: 3, val: 'kanske' },
    ]
    const efter: Vote[] = [
      { plats: 1, val: 'ja' }, // oförändrad
      { plats: 2, val: 'ja' }, // bytte
      { plats: 3, val: 'nej' }, // bytte
    ]
    const d = attitydDelta(fore, efter)
    expect(d.andrade).toBe(2)
    expect(d.jamforbara).toBe(3)
    expect(d.fore).toEqual({ ja: 1, nej: 1, kanske: 1 })
    expect(d.efter).toEqual({ ja: 2, nej: 1 })
  })

  it('ignorerar platser som bara röstat i en mätpunkt', () => {
    const d = attitydDelta([{ plats: 1, val: 'ja' }], [{ plats: 2, val: 'nej' }])
    expect(d.jamforbara).toBe(0)
    expect(d.andrade).toBe(0)
  })

  it('tally räknar rätt', () => {
    expect(tally([{ plats: 1, val: 'ja' }, { plats: 2, val: 'ja' }])).toEqual({ ja: 2 })
  })
})
