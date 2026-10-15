/**
 * Röst PÅ: hämtar uppläst ljud från gatewayns /speak (ElevenLabs-nyckel bor
 * server-side; fronten pratar aldrig direkt). Best-effort: alla fel sväljs så
 * flödet (C→D→NÄSTA) aldrig blockeras av röst.
 *
 * Anropas i delruta D EFTER att svar_text redan visats som text; ljudet läggs
 * ovanpå. (Mening-för-mening-streaming kan läggas till här utan att gränssnittet
 * ändras — pilot spelar hela svaret när det är klart.)
 */
import type { Speak } from './Speak'

export class HttpSpeak implements Speak {
  readonly enabled = true
  private el: HTMLAudioElement | null = null
  private lastUrl: string | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly configId: string,
    /** Uppspelningshastighet (1 = normal). Pitch bevaras. */
    private readonly rate = 1,
  ) {}

  async speak(text: string): Promise<void> {
    if (!text.trim() || typeof window === 'undefined') return
    try {
      const url = `${this.baseUrl.replace(/\/+$/, '')}/speak`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: this.configId, text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      this.cancel()
      this.lastUrl = URL.createObjectURL(blob)
      const el = new Audio(this.lastUrl)
      // Snabbare uppspelning med bevarad pitch (ingen "chipmunk"-effekt).
      const anyEl = el as HTMLAudioElement & { preservesPitch?: boolean }
      anyEl.preservesPitch = true
      el.playbackRate = this.rate
      this.el = el
      await el.play().catch(() => undefined)
      await new Promise<void>((resolve) => {
        el.onended = () => resolve()
        el.onerror = () => resolve()
      })
    } catch {
      // Röst är icke-kritisk — svälj tyst, texten står kvar.
    }
  }

  cancel(): void {
    try {
      this.el?.pause()
    } catch {
      /* ignore */
    }
    if (this.lastUrl) {
      URL.revokeObjectURL(this.lastUrl)
      this.lastUrl = null
    }
    this.el = null
  }
}
