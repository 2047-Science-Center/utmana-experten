/**
 * Format-registret. Varje format är en JSON-fil i configs/formats/. De laddas
 * via import.meta.glob → att LÄGGA TILL ETT FORMAT = ny .json + i18n/manifest,
 * INGEN kodändring (motorn kör vilken steps[] som helst).
 */
import type { FormatDef } from './engine/types'

const modules = import.meta.glob<{ default: FormatDef }>('./configs/formats/*.json', { eager: true })

/** Visningsordning (kända format först; okända sorteras efter id sist). */
const ORDER = [
  'tyck-till-facit',
  'syna-experten',
  'andra-dig',
  'prata-in',
  'radgivaren',
  'spa-utfallet',
  'ta-parti',
]

export const FORMATS: FormatDef[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.id)
    const ib = ORDER.indexOf(b.id)
    if (ia === -1 && ib === -1) return a.id.localeCompare(b.id)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

export function formatById(id: string): FormatDef | undefined {
  return FORMATS.find((f) => f.id === id)
}

/** Default-format (det skarpt byggda) — används av attract/pilot. */
export const DEFAULT_FORMAT_ID = 'tyck-till-facit'
