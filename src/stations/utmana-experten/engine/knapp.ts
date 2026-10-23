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

/** Fysiska knapp-platser i ordning (vänster/mitt/höger). Firmware publicerar
 *  dessa slot-id:n; namngivna alternativ mappas på POSITION, inte på namn. */
const SLOTS = ['nej', 'kanske', 'ja']

/**
 * - vote: knapp ∈ allowedVals → registrera direkt (ja/nej/kanske-format);
 *   annars, OM formatet använder namngivna alternativ (inga val är ja/nej/kanske),
 *   tolka knappen som en POSITION (SLOTS) och mappa till alternativet på samma
 *   index (t.ex. Rådgivaren); annars ignorera. Så slår t.ex. mitten-knappen i en
 *   tvåvalsröstning (ja/nej) inte fel — den ignoreras som förr.
 * - speak_round: endast den AKTIVA platsens knapp = "klar ▸" → turbyte
 *   (vilken av de tre knapparna spelar ingen roll i tänk-läge).
 * - annat steg: ignorera.
 */
export function interpretKnapp(ctx: KnappContext): KnappAction {
  if (ctx.stepType === 'vote') {
    const allowed = ctx.allowedVals ?? []
    if (allowed.includes(ctx.knapp)) return { kind: 'vote', plats: ctx.plats, val: ctx.knapp }
    const named = allowed.length > 0 && !allowed.some((v) => SLOTS.includes(v))
    if (named) {
      const slot = SLOTS.indexOf(ctx.knapp)
      if (slot >= 0 && slot < allowed.length) return { kind: 'vote', plats: ctx.plats, val: allowed[slot] }
    }
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
