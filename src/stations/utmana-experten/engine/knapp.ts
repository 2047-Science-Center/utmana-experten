/**
 * Ren tolkning av en arkadknapp-tryckning, beroende på aktuellt steg. Samma
 * väg för hårdvaru-knapp (MQTT utmanaexperten/knapp) och on-screen-knapp — båda
 * går genom denna funktion. Ingen röstigenkänning: röstning är ren knapp-input.
 */
import type { StepType } from './types'

export type KnappAction =
  | { kind: 'vote'; plats: number; val: string }
  | { kind: 'turn-advance'; plats: number }
  | { kind: 'ignore' }

export interface KnappContext {
  stepType: StepType | null
  plats: number
  knapp: string
  /** vote-steget: tillåtna val (knappar som inte erbjuds ignoreras). */
  allowedVals?: string[]
  /** speak_round: platsen som har ordet just nu (0 = ingen). */
  activePlats?: number
}

/**
 * - vote: knapp ∈ allowedVals → registrera platsens val; annars ignorera.
 * - speak_round: endast den AKTIVA platsens knapp = "klar ▸" → turbyte
 *   (vilken av de tre knapparna spelar ingen roll i tänk-läge).
 * - annat steg: ignorera.
 */
export function interpretKnapp(ctx: KnappContext): KnappAction {
  if (ctx.stepType === 'vote') {
    const allowed = ctx.allowedVals ?? []
    if (allowed.includes(ctx.knapp)) return { kind: 'vote', plats: ctx.plats, val: ctx.knapp }
    return { kind: 'ignore' }
  }
  if (ctx.stepType === 'speak_round') {
    if (ctx.activePlats && ctx.plats === ctx.activePlats) {
      return { kind: 'turn-advance', plats: ctx.plats }
    }
    return { kind: 'ignore' }
  }
  return { kind: 'ignore' }
}
