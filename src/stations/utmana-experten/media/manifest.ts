/**
 * Media-manifest. Mappar (format, contentId) → {typ, aspect, brief, file?}. Utan
 * `file` renderar MediaSlot en placeholder-ruta med briefen — layouten är klar,
 * media droppas in sen. Manifesten är data: configs/media.<format>.json, laddade
 * via glob → nya klipp = ny fil/rad, ingen kodändring.
 */
import { asset } from '@/config'

export type MediaTyp = 'video' | 'video-loop' | 'image'
export type MediaAspect = '16:9' | '1:1' | '9:16'

export interface MediaEntry {
  typ: MediaTyp
  aspect: MediaAspect
  brief: string
  file?: string
}

type Manifest = Record<string, MediaEntry>

const modules = import.meta.glob<{ default: Manifest }>('../configs/media.*.json', { eager: true })

/** filväg "../configs/media.<format>.json" → formatId */
const byFormat: Record<string, Manifest> = {}
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/media\.([^.]+)\.json$/)
  if (m) byFormat[m[1]] = mod.default
}

export interface ResolvedMedia extends MediaEntry {
  src: string | null
}

/** Slå upp media; alltid ett svar (generisk placeholder om manifest saknas). */
export function media(formatId: string, contentId: string): ResolvedMedia {
  const entry = byFormat[formatId]?.[contentId]
  if (!entry) {
    return { typ: 'video', aspect: '16:9', brief: contentId, src: null }
  }
  return { ...entry, src: entry.file ? asset(`/media/${entry.file}`) : null }
}
