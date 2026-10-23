/**
 * MQTT-over-WebSocket-buss (mqtt.js). Publicerar lager-1-cues på <root>/... och
 * prenumererar på <root>/knapp + <root>/gm/# → routar in till storen. Används när
 * config.rig.wsUrl är satt eller ?mqtt=ws://host:9001 finns i URL:en; då når
 * `mosquitto_pub -t utmanaexperten/knapp -m '{"plats":1,"knapp":"ja"}'` appen.
 *
 * Appen publicerar ALDRIG lager 2 (pixlar) — det gör hjärnan/Blocks. scen och
 * aktiv_plats publiceras retained så en sent ansluten hjärna hamnar rätt.
 */
import mqtt, { type MqttClient } from 'mqtt'
import type { Rig, Scen, KnappEvent, GmEvent, StatusSnapshot } from './Rig'

export class MqttRig implements Rig {
  private client: MqttClient
  private knappCb: ((e: KnappEvent) => void) | null = null
  private gmCb: ((e: GmEvent) => void) | null = null

  constructor(
    wsUrl: string,
    private readonly root = 'utmanaexperten',
  ) {
    this.client = mqtt.connect(wsUrl, { reconnectPeriod: 2000, clientId: `utmana-app-${Math.random().toString(16).slice(2, 8)}` })
    this.client.on('connect', () => {
      this.client.subscribe(`${this.root}/knapp`)
      this.client.subscribe(`${this.root}/gm/#`)
    })
    this.client.on('message', (topic, payload) => this.route(topic, payload.toString()))
  }

  private route(topic: string, msg: string): void {
    if (topic === `${this.root}/knapp`) {
      try {
        const d = JSON.parse(msg) as KnappEvent
        if (typeof d.plats === 'number' && typeof d.knapp === 'string') this.knappCb?.(d)
      } catch {
        /* ogiltig payload — ignorera */
      }
      return
    }
    const gmPrefix = `${this.root}/gm/`
    if (topic.startsWith(gmPrefix)) {
      this.gmCb?.({ cmd: topic.slice(gmPrefix.length), value: msg })
    }
  }

  private pub(topic: string, msg: string, retain = false): void {
    this.client.publish(`${this.root}/${topic}`, msg, { retain })
  }

  scen(scen: Scen): void {
    this.pub('scen', scen, true)
  }
  aktivPlats(plats: number): void {
    this.pub('aktiv_plats', String(plats), true)
  }
  rost(plats: number, val: string): void {
    this.pub('rost', JSON.stringify({ plats, val }))
  }
  facitRatt(val: string): void {
    this.pub('facit_ratt', JSON.stringify({ val }))
  }
  timer(plats: number, sekunder?: number): void {
    this.pub('timer', JSON.stringify(sekunder != null ? { plats, sekunder } : { plats }))
  }
  ljud(id: string): void {
    this.pub('ljud', id)
  }
  status(snapshot: StatusSnapshot): void {
    // Retained → en sent ansluten spelledar-skärm får direkt aktuellt läge.
    this.pub('status', JSON.stringify(snapshot), true)
  }

  onKnapp(cb: (e: KnappEvent) => void): void {
    this.knappCb = cb
  }
  onGm(cb: (e: GmEvent) => void): void {
    this.gmCb = cb
  }
  close(): void {
    try {
      this.client.end(true)
    } catch {
      /* no-op */
    }
  }
}
