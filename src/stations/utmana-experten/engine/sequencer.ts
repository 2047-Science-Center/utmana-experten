/**
 * Ren, testbar sekvenserare för steg-motorn. Inga Vue-beroenden — storen håller
 * reaktivt `stepIndex` och anropar dessa funktioner. Motorn kör `steps[]` i
 * ordning; `index >= steps.length` betyder klart.
 */
import type { Step, StepType, Vote } from './types'

export function currentStep(steps: Step[], index: number): Step | null {
  return steps[index] ?? null
}

export function isLastStep(steps: Step[], index: number): boolean {
  return steps.length > 0 && index === steps.length - 1
}

export function isDone(steps: Step[], index: number): boolean {
  return index >= steps.length
}

/** Nästa index (klampat till steps.length = klar-sentinel). */
export function nextIndex(steps: Step[], index: number): number {
  return Math.min(index + 1, steps.length)
}

/** Alla steg av en viss typ (t.ex. för att hitta mätpunkterna i förväg). */
export function stepsOfType<T extends Step>(steps: Step[], typ: StepType): T[] {
  return steps.filter((s): s is T => s.typ === typ)
}

/**
 * Nästa plats i en tänk-runda. `seats` = aktiva platser i ordning (t.ex. [1,2,3]).
 * active=0 → första platsen; returnerar null när rundan är slut.
 */
export function nextSeat(seats: number[], active: number): number | null {
  if (seats.length === 0) return null
  if (active === 0) return seats[0]
  const i = seats.indexOf(active)
  if (i < 0 || i >= seats.length - 1) return null
  return seats[i + 1]
}

/** Räkna röster per val. */
export function tally(votes: Vote[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of votes) out[v.val] = (out[v.val] ?? 0) + 1
  return out
}

export interface AttitydDelta {
  /** Antal platser som ändrade sitt val före→efter (= mätbar effekt). */
  andrade: number
  /** Platser som röstat i båda mätpunkterna. */
  jamforbara: number
  fore: Record<string, number>
  efter: Record<string, number>
}

/** Attityd-delta: hur många platser som bytte åsikt mellan mätpunkterna. */
export function attitydDelta(fore: Vote[], efter: Vote[]): AttitydDelta {
  const foreByPlats = new Map(fore.map((v) => [v.plats, v.val]))
  const efterByPlats = new Map(efter.map((v) => [v.plats, v.val]))
  let andrade = 0
  let jamforbara = 0
  for (const [plats, foreVal] of foreByPlats) {
    const efterVal = efterByPlats.get(plats)
    if (efterVal == null) continue
    jamforbara += 1
    if (efterVal !== foreVal) andrade += 1
  }
  return { andrade, jamforbara, fore: tally(fore), efter: tally(efter) }
}
