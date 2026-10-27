/**
 * Ljudmotor — spelar riktiga ljudfiler (ElevenLabs-cues i public/audio/) när de
 * finns, annars faller tillbaka på SYNTETISERAD SFX via Web Audio. Så kiosken
 * hör den sammanhållna ljudidentiteten, och allt funkar även utan filer.
 *
 * One-shots via `play(sfx)`. Loopar (bäddar: attract/tänk/bearbetar) via
 * `playLoop`/`stopLoop`; `duck(on)` sänker alla bäddar (t.ex. under klippet).
 *
 * Kiosk-autoplay: AudioContext skapas låst och låses upp på första
 * användargesten (attract-/"tryck för att börja"-skärmen). Global mute + volym.
 */

export type Sfx =
  // äldre (synt-fallback finns)
  | 'blip'
  | 'confirm'
  | 'deny'
  | 'render'
  | 'hatch'
  | 'win'
  | 'boot'
  // nya flödes-cues (fil-backade; organisk-omställning)
  | 'namn-klar'
  | 'fraga-anslag'
  | 'alla-rostat'
  | 'din-tur'
  | 'timer-varning'
  | 'bedomning-klar'
  | 'dom-landar'
  | 'facit'
  | 'gate-in'
  | 'redo'
  | 'alla-gront'
  | 'pre-klipp'
  | 'overlay-chime'
  | 'steg-whoosh'
  | 'pre-reveal'
  | 'utfall-tankte-om'
  | 'utfall-stod-fast'

/** Sömlösa bäddar som spelas som loop (via playLoop/stopLoop). */
export type LoopSfx = 'attract-loop' | 'tank-badd' | 'bearbetar'

type AnyCue = Sfx | LoopSfx

/** One-shot-cues med en riktig ljudfil i public/audio/<namn>.mp3. */
const FILE_CUES: Sfx[] = [
  'confirm', 'blip', 'boot', 'win', 'deny',
  'namn-klar', 'fraga-anslag', 'alla-rostat', 'din-tur', 'timer-varning',
  'bedomning-klar', 'dom-landar', 'facit', 'gate-in', 'redo', 'alla-gront',
  'pre-klipp', 'overlay-chime', 'steg-whoosh', 'pre-reveal',
  'utfall-tankte-om', 'utfall-stod-fast',
]
const LOOP_CUES: LoopSfx[] = ['attract-loop', 'tank-badd', 'bearbetar']

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private loopBus: GainNode | null = null // alla bäddar hit → duckning
  private _muted = false
  private _volume = 0.6
  private unlocked = false
  /** Avkodade ljudfiler per cue (laddas vid unlock). Saknas → syntton/tyst. */
  private buffers: Partial<Record<AnyCue, AudioBuffer>> = {}
  /** Aktiva looper (bäddar) → deras källa, för stopp. */
  private loops: Partial<Record<LoopSfx, AudioBufferSourceNode>> = {}

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
      this.loopBus = this.ctx.createGain()
      this.loopBus.gain.value = 1
      this.loopBus.connect(this.master)
      this.unlocked = true
    } catch {
      // Ljud är icke-kritiskt — spelet funkar utan.
      this.unlocked = false
    }
    void this.ctx?.resume()
    void this.preload()
  }

  /** Hämta + avkoda ljudfilerna en gång (icke-kritiskt; faller tillbaka på
   *  syntton/tyst om något saknas eller inte hinner laddas). */
  private async preload(): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
    const all: AnyCue[] = [...FILE_CUES, ...LOOP_CUES]
    await Promise.all(
      all.map(async (name) => {
        if (this.buffers[name]) return
        try {
          const res = await fetch(encodeURI(`${base}/audio/${name}.mp3`))
          if (!res.ok) return
          this.buffers[name] = await ctx.decodeAudioData(await res.arrayBuffer())
        } catch {
          /* ingen fil / avkodning misslyckades → syntton/tyst används */
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

  // ---- Looper / bäddar ----

  /** Starta en bädd som loop (no-op om redan igång eller fil saknas). */
  playLoop(name: LoopSfx): void {
    if (this.loops[name] || !this.ctx || !this.loopBus) return
    const buf = this.buffers[name]
    if (!buf) return // ingen fil → ingen bädd (syntton skulle inte loopa snyggt)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(this.loopBus)
    src.start()
    this.loops[name] = src
  }

  /** Stoppa en bädd. */
  stopLoop(name: LoopSfx): void {
    const src = this.loops[name]
    if (!src) return
    try {
      src.stop()
    } catch {
      /* redan stoppad */
    }
    delete this.loops[name]
  }

  /** Stoppa alla bäddar. */
  stopAllLoops(): void {
    for (const name of Object.keys(this.loops) as LoopSfx[]) this.stopLoop(name)
  }

  /** Ducka ned (eller återställ) alla bäddar — t.ex. under klippet. */
  duck(on: boolean): void {
    if (!this.loopBus || !this.ctx) return
    const g = on ? 0.18 : 1
    this.loopBus.gain.setTargetAtTime(g, this.ctx.currentTime, 0.15)
  }

  // ---- Syntton (fallback för äldre cues) ----

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
    // Riktig ljudfil om den laddats, annars syntton (fallback för äldre cues).
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
      default:
        /* nya cues utan fil → tyst (icke-kritiskt) */
        break
    }
  }
}

/** Singleton — en ljudmotor per kiosk. */
export const audio = new AudioEngine()
