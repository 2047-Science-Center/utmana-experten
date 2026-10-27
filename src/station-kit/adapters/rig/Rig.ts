/**
 * Rigg-sömmen, LAGER 1 (semantiskt). Spegel av Eco Loco mellans RIGG-KONTRAKT:
 * appen känner BARA semantik (scen/aktiv plats/röst/facit/timer/ljud) och
 * knapp/gm in — ALDRIG pixlar. En hjärna (Python-stubb nu → Blocks sen)
 * översätter till lager 2 (granulärt, utmanaexperten/out/led...). Bytet
 * Python→Blocks är osynligt: lager 1 är fryst här.
 *
 * Topics (topicRoot = config.rig.topicRoot, default "utmanaexperten"):
 *   UT (app→hjärna):  <root>/scen (retained) · <root>/aktiv_plats (retained)
 *                     <root>/rost {plats,val} · <root>/facit_ratt {val}
 *                     <root>/timer {plats,sekunder} · <root>/ljud <id>
 *                     <root>/status (retained) = hela motor-läget för spelledar-
 *                        fönstret på en annan skärm/enhet (kontroll-plan, INTE en
 *                        ljus-cue → publiceras även under master-lås).
 *   IN (ESP/hjärna/spelledare→app): <root>/knapp {plats,knapp} · <root>/gm/<cmd> <value>
 */

export type Scen = 'attract' | 'present' | 'vote' | 'speak' | 'gate' | 'overlay' | 'facit' | 'reality' | 'verdict'

export interface KnappEvent {
  plats: number
  knapp: string
}

export interface GmEvent {
  /** t.ex. "format", "mode", "start", "nasta", "musik", "master", "plats/2". */
  cmd: string
  value: string
}

/** En röst-slot (knappordning + positionsfärg) — så spelledar-fönstret kan
 *  märka testknappar/dioder rätt för aktuellt format (ja/nej/kanske el. namngivna). */
export interface StatusSlot {
  id: string
  label: string
  color: string
}

/** Hela motor-läget, retained på <root>/status. Räcker för att rita upp en
 *  fjärr-spelledarvy (fas, format, läge, steg, väntar, röster) utan tillgång
 *  till storen. Data, inte kommandon. */
export interface StatusSnapshot {
  fas: 'lobby' | 'kör' | 'klar'
  started: boolean
  finished: boolean
  formatId: string | null
  formatNamn: string | null
  mode: 'self' | 'gm'
  /** 0-baserat stegindex (0 om ej startad); stepTotal = antal steg i formatet. */
  stepIndex: number
  stepTotal: number
  stepTyp: string | null
  awaitingNext: boolean
  paused: boolean
  masterLocked: boolean
  activePlats: number
  seats: number[]
  /** Visningsnamn per plats (inskrivet eller platshållare). */
  namn: Record<number, string>
  /** Vald variant + formatets varianter (Ändra digs titlar) för panel-väljaren. */
  variantId: string | null
  varianter: { id: string; titel: string }[]
  /** Aktuella röst-slottar (knappordning) för labels/testknappar. */
  slots: StatusSlot[]
  /** Nuvarande mätpunkts röster (plats → val) + mätpunkt. */
  votes: { plats: number; val: string }[]
  matpunkt: string | null
  ts: number
}

export interface Rig {
  // --- lager 1 ut ---
  scen(scen: Scen): void
  aktivPlats(plats: number): void
  rost(plats: number, val: string): void
  facitRatt(val: string): void
  timer(plats: number, sekunder?: number): void
  ljud(id: string): void
  /** Kontroll-plan ut: hela motor-läget för fjärr-spelledaren (retained). */
  status(snapshot: StatusSnapshot): void
  // --- in (hårdvara/spelledare → app) ---
  onKnapp(cb: (e: KnappEvent) => void): void
  onGm(cb: (e: GmEvent) => void): void
  close(): void
}
