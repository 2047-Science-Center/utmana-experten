/**
 * Minimal WebVTT-parser för undertext. Standardformat (samma som Josef
 * transkriberar till). Vi parsar själva i stället för <track> för att kunna
 * styla undertexten i CRT-profilen. Tålig: trasig/saknad fil → tom lista.
 */

export interface VttCue {
  start: number // sekunder
  end: number
  text: string
}

/** "mm:ss.cc" | "hh:mm:ss.mmm" | "ss.mmm" → sekunder. */
function parseTimestamp(ts: string): number {
  const clean = ts.trim().replace(',', '.')
  const parts = clean.split(':')
  let s = 0
  for (const p of parts) s = s * 60 + parseFloat(p)
  return s
}

export function parseVtt(text: string): VttCue[] {
  const cues: VttCue[] = []
  // Normalisera radslut och dela i block.
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n\n+/)
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) continue
    // Hitta raden med "-->" (kan föregås av en cue-identifierare).
    const arrowIdx = lines.findIndex((l) => l.includes('-->'))
    if (arrowIdx === -1) continue // WEBVTT-header eller NOTE — hoppa
    const [from, toRest] = lines[arrowIdx].split('-->')
    if (!from || !toRest) continue
    const to = toRest.trim().split(/\s+/)[0] // strippa ev. cue-settings
    const start = parseTimestamp(from)
    const end = parseTimestamp(to)
    if (Number.isNaN(start) || Number.isNaN(end)) continue
    const textLines = lines.slice(arrowIdx + 1)
    cues.push({ start, end, text: textLines.join('\n') })
  }
  return cues
}

/** Aktiv cue för en given tid (eller null). */
export function cueAt(cues: VttCue[], t: number): VttCue | null {
  for (const c of cues) if (t >= c.start && t < c.end) return c
  return null
}

/** Hämta och parsa en .vtt. Saknad/trasig fil → []. */
export async function loadVtt(url: string): Promise<VttCue[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    return parseVtt(await res.text())
  } catch {
    return []
  }
}
