/**
 * Ljudmotor — spelar riktiga ljudfiler (ElevenLabs-cues i public/audio/) när de
 * finns, annars faller tillbaka på SYNTETISERAD SFX via Web Audio. Så kiosken
 * hör den sammanhållna ljudidentiteten, och allt funkar även utan filer.
 *
 * Kiosk-autoplay: AudioContext skapas låst och låses upp på första
 * användargesten (attract-/"tryck för att börja"-skärmen). Global mute + volym.
 */

export type Sfx =
  | 'blip' // tangent-blip (teletype)
  | 'confirm' // bekräfta-pling
  | 'deny' // neka/fel-surr
  | 'render' // bild-render-svep
  | 'hatch' // lucka-tänd-blip
  | 'win' // vinst-fanfar
  | 'boot' // boot-sekvens

/** Cues med en riktig ljudfil i public/audio/<namn>.mp3 (resten = syntton). */
const FILE_CUES: Sfx[] = ['confirm', 'blip', 'boot', 'win', 'deny']

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private _muted = false
  private _volume = 0.6
  private unlocked = false
  /** Avkodade ljudfiler per cue (laddas vid unlock). Saknas → syntton. */
  private buffers: Partial<Record<Sfx, AudioBuffer>> = {}

  get muted(): boolean {
    return this._muted
  }

  get volume(): number {
    return this._volume
  }

  setMuted(muted: boolean): void {
    this._muted = muted
    if (this.master) {
      this.master.gain.value = muted ? 0 : this._volume
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this._muted)
    return this._muted
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v))
    if (this.master && !this._muted) {
      this.master.gain.value = this._volume
    }
  }

  /** Lås upp ljudkontexten — anropas på första användargesten. */
  unlock(): void {
    if (this.unlocked) return
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this._muted ? 0 : this._volume
      this.master.connect(this.ctx.destination)
      this.unlocked = true
    } catch {
      // Ljud är icke-kritiskt — spelet funkar utan.
      this.unlocked = false
    }
    void this.ctx?.resume()
    void this.preload()
  }

  /** Hämta + avkoda ljudfilerna en gång (icke-kritiskt; faller tillbaka på
   *  syntton om något saknas eller inte hinner laddas). */
  private async preload(): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
    await Promise.all(
      FILE_CUES.map(async (name) => {
        if (this.buffers[name]) return
        try {
          const res = await fetch(encodeURI(`${base}/audio/${name}.mp3`))
          if (!res.ok) return
          this.buffers[name] = await ctx.decodeAudioData(await res.arrayBuffer())
        } catch {
          /* ingen fil / avkodning misslyckades → syntton används */
        }
      }),
    )
  }

  /** Spela en avkodad ljudfil som one-shot genom master-noden. */
  private playBuffer(buf: AudioBuffer): void {
    if (!this.ctx || !this.master) return
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.connect(this.master)
    src.start()
  }

  /** En enkel ton med envelope. */
  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  /** Ett frekvenssvep (render, boot). */
  private sweep(
    from: number,
    to: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.linearRampToValueAtTime(to, start + dur)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  /** En kort ton med given frekvens — för stegrande budljud (intro). */
  beep(freq: number, dur = 0.12): void {
    if (this._muted || !this.ctx || !this.master) return
    this.tone(freq, this.ctx.currentTime, dur, 'square', 0.12)
  }

  play(sfx: Sfx): void {
    if (this._muted || !this.ctx || !this.master) return
    // Riktig ljudfil om den laddats, annars syntton (fallback).
    const buf = this.buffers[sfx]
    if (buf) {
      this.playBuffer(buf)
      return
    }
    const now = this.ctx.currentTime
    switch (sfx) {
      case 'blip':
        this.tone(1200 + Math.random() * 300, now, 0.03, 'square', 0.08)
        break
      case 'confirm':
        this.tone(660, now, 0.09, 'triangle', 0.18)
        this.tone(990, now + 0.08, 0.12, 'triangle', 0.18)
        break
      case 'deny':
        this.tone(180, now, 0.18, 'sawtooth', 0.16)
        this.tone(140, now + 0.05, 0.2, 'sawtooth', 0.14)
        break
      case 'render':
        this.sweep(220, 1400, now, 0.35, 'sawtooth', 0.06)
        break
      case 'hatch':
        this.tone(880, now, 0.05, 'square', 0.12)
        this.tone(1320, now + 0.04, 0.06, 'square', 0.1)
        break
      case 'win':
        this.tone(523, now, 0.12, 'triangle', 0.2)
        this.tone(659, now + 0.11, 0.12, 'triangle', 0.2)
        this.tone(784, now + 0.22, 0.12, 'triangle', 0.2)
        this.tone(1047, now + 0.33, 0.22, 'triangle', 0.22)
        break
      case 'boot':
        this.sweep(80, 520, now, 0.5, 'sawtooth', 0.1)
        this.tone(660, now + 0.55, 0.08, 'square', 0.12)
        break
    }
  }
}

/** Singleton — en ljudmotor per kiosk. */
export const audio = new AudioEngine()
