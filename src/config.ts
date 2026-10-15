/**
 * Central stationskonfiguration — EN plats för pilot↔drift (config.mode) och
 * alla sömmar. Byter man läge byts adaptrarna (se station-kit/adapters); ingen
 * spellogik rörs. Inga hemligheter här — nycklar bor i server/.env.
 *
 * `asset()` ger rätt URL för filer i public/ (respekterar VITE_BASE på Pages).
 */
import type { Lang } from '@/station-kit/i18n'

export type Mode = 'pilot' | 'production'

/** Stationsnummer för resultat-sömmen (station<N>/result). Anta ALDRIG legacy —
 *  sätts när stationen får sitt nummer i huset. 0 = ej tilldelat (pilot). */
export const STATION_N = 0

export const config = {
  mode: 'pilot' as Mode,
  stationN: STATION_N,
  lang: 'sv' as Lang,

  /** Antal platser (tävlande). Prototyp = 1; drift upp till 6. */
  seats: 6,

  /** Tänk-tur per plats (speak_round-default, överstyrs per steg i format-configen). */
  speakSeconds: 15,
  warnAtSeconds: 5,

  /** Attract → auto-start efter N ms sysslolöshet (0 = aldrig). */
  attractIdleMs: 0,

  /** /assess-gatewayn. Tom sträng = samma origin (kiosk-bygget). */
  assess: {
    baseUrl: import.meta.env.VITE_ASSESS_URL ?? 'http://localhost:8787',
  },

  /** NPC-röst (ElevenLabs via gateway). AV i pilot — texten är grunden. */
  speak: { enabled: false, rate: 1.0 },

  /** Rigg-sömmen (lager 1 — semantiska cues ut, knapp/gm in). Appen känner
   *  ALDRIG lager 2 (pixlar) — hjärnan/Blocks översätter. Tom wsUrl → LogBus
   *  (loggar cues, on-screen-knappar driver flödet); sätt ws://host:9001 för
   *  en riktig MQTT-over-WS-buss (mosquitto_pub når då knapp-topicen). */
  rig: {
    topicRoot: 'utmanaexperten',
    wsUrl: import.meta.env.VITE_MQTT_URL ?? '',
  },

  /** Drift-endpoints (fylls ur env i produktion, aldrig i git). */
  production: {
    wsUrl: '',
    mqttUrl: '',
  },
} as const

export function asset(path: string): string {
  return encodeURI(import.meta.env.BASE_URL + path.replace(/^\/+/, ''))
}

/** Platshållar-namn per plats (ersätts/tas bort när incheckning finns). */
export const SEAT_NAMES: Record<number, string> = {
  1: 'Vide',
  2: 'Noor',
  3: 'Elias',
  4: 'Saga',
  5: 'Omar',
  6: 'Liv',
}

export function seatName(n: number): string {
  return SEAT_NAMES[n] ?? `Plats ${n}`
}

/** Varumärke i HUD:en. */
export const GAME_BRAND = 'Utmana experten'
