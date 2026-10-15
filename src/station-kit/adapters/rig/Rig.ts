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
 *   IN (ESP/hjärna→app): <root>/knapp {plats,knapp} · <root>/gm/<cmd> <value>
 */

export type Scen = 'attract' | 'present' | 'vote' | 'speak' | 'facit' | 'reality' | 'verdict'

export interface KnappEvent {
  plats: number
  knapp: string
}

export interface GmEvent {
  /** t.ex. "format", "mode", "start", "nasta", "musik", "master", "plats/2". */
  cmd: string
  value: string
}

export interface Rig {
  // --- lager 1 ut ---
  scen(scen: Scen): void
  aktivPlats(plats: number): void
  rost(plats: number, val: string): void
  facitRatt(val: string): void
  timer(plats: number, sekunder?: number): void
  ljud(id: string): void
  // --- in (hårdvara/spelledare → app) ---
  onKnapp(cb: (e: KnappEvent) => void): void
  onGm(cb: (e: GmEvent) => void): void
  close(): void
}
