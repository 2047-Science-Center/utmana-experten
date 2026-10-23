/**
 * Spelledar-fönstrets MQTT-länk — INVERSEN av stationens MqttRig. Körs i ett
 * eget fönster på en annan skärm/enhet och talar med stationen via EXAKT samma
 * söm (ingen egen spellogik):
 *   PRENUMERERAR: <root>/status (retained)  → hela motor-läget (ritas upp)
 *   PUBLICERAR:   <root>/gm/<cmd> <value>    → transport/format/läge/master/…
 *                 <root>/knapp {plats,knapp} → simulerade bordsknappar (test)
 *
 * Samma vokabulär som Blocks-dirigenten; stationen vet inte om kommandot kom
 * från den här vyn, en fysisk knapp eller Blocks.
 */
import mqtt, { type MqttClient } from 'mqtt'
import type { StatusSnapshot } from '@/station-kit/adapters/rig/Rig'

export class SpelledareLink {
  private client: MqttClient
  private statusCb: ((s: StatusSnapshot) => void) | null = null
  private connCb: ((connected: boolean) => void) | null = null

  constructor(
    wsUrl: string,
    private readonly root = 'utmanaexperten',
  ) {
    this.client = mqtt.connect(wsUrl, {
      reconnectPeriod: 2000,
      clientId: `utmana-gm-${Math.random().toString(16).slice(2, 8)}`,
    })
    this.client.on('connect', () => {
      this.connCb?.(true)
      this.client.subscribe(`${this.root}/status`)
    })
    this.client.on('reconnect', () => this.connCb?.(false))
    this.client.on('close', () => this.connCb?.(false))
    this.client.on('error', () => this.connCb?.(false))
    this.client.on('message', (topic, payload) => {
      if (topic !== `${this.root}/status`) return
      try {
        this.statusCb?.(JSON.parse(payload.toString()) as StatusSnapshot)
      } catch {
        /* ogiltig payload — ignorera */
      }
    })
  }

  onStatus(cb: (s: StatusSnapshot) => void): void {
    this.statusCb = cb
  }
  onConnection(cb: (connected: boolean) => void): void {
    this.connCb = cb
  }

  /** gm/<cmd> — samma kommandon som store.onGm hanterar. */
  gm(cmd: string, value = '1'): void {
    this.client.publish(`${this.root}/gm/${cmd}`, value)
  }
  /** Simulera en bordsknapp (test utan rigg). */
  knapp(plats: number, knapp: string): void {
    this.client.publish(`${this.root}/knapp`, JSON.stringify({ plats, knapp }))
  }

  close(): void {
    try {
      this.client.end(true)
    } catch {
      /* no-op */
    }
  }
}
