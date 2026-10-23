/**
 * EN sanning för röst-slottarna: de tre fysiska arkadknapparna per plats är
 * vänster/mitt/höger och lyser alltid rött/gult/grönt (hårdvarans identitet,
 * inte "rätt/fel"). Ett format röstar antingen på ja/nej/kanske ELLER på
 * namngivna alternativ — båda mappas på SAMMA tre positioner. Horseshoe,
 * VoteStep och PresentStep delar den här mappningen så skärm och knapp stämmer.
 */
import type { FormatDef } from './types'

/** Positionsfärger vänster→höger (speglar de fysiska knapparnas färg). */
export const SLOT_COLORS = ['#e23b2e', '#f2c021', '#36b34a'] as const

const JNK_SLOTS = ['nej', 'kanske', 'ja']
const JNK_LABELS: Record<string, string> = { nej: 'Nej', kanske: 'Kanske', ja: 'Ja' }

export interface SlotOption {
  id: string
  label: string
  color: string
  /** Kort förklaring (bara för namngivna alternativ med beskrivning). */
  beskrivning?: string
}

/** Slottarna för ett format i knappordning. Namngivna alternativ om de finns,
 *  annars ja/nej/kanske. Positionsfärgen följer indexet. */
export function slotsOf(format: FormatDef | null | undefined): SlotOption[] {
  if (format?.alternativ?.length) {
    return format.alternativ.map((a, i) => ({ id: a.id, label: a.label, color: SLOT_COLORS[i] ?? '#8a5a2a', beskrivning: a.beskrivning }))
  }
  return JNK_SLOTS.map((id, i) => ({ id, label: JNK_LABELS[id], color: SLOT_COLORS[i] }))
}

/** Färgen för ett konkret val (vote.val) inom ett format. */
export function colorOf(format: FormatDef | null | undefined, val: string | null): string {
  if (!val) return '#8a5a2a'
  const slot = slotsOf(format).find((s) => s.id === val)
  return slot?.color ?? '#8a5a2a'
}
