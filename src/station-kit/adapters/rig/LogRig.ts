/**
 * Pilot-default: loggar varje lager-1-cue till konsolen (`[rig→] <topic> <msg>`)
 * — samma form som en riktig MQTT-publicering, så flödet går att följa utan
 * broker. Tar emot inga knapp/gm (on-screen-knapparna driver flödet direkt in
 * i storen via samma väg). Sätt config.rig.wsUrl / ?mqtt= för riktig MQTT.
 */
import type { Rig, Scen, KnappEvent, GmEvent, StatusSnapshot } from './Rig'

export class LogRig implements Rig {
  constructor(private readonly root = 'utmanaexperten') {}

  private log(topic: string, msg: string): void {
    // eslint-disable-next-line no-console
    console.info(`[rig→] ${this.root}/${topic} ${msg}`)
  }

  scen(scen: Scen): void {
    this.log('scen', scen)
  }
  aktivPlats(plats: number): void {
    this.log('aktiv_plats', String(plats))
  }
  rost(plats: number, val: string): void {
    this.log('rost', JSON.stringify({ plats, val }))
  }
  facitRatt(val: string): void {
    this.log('facit_ratt', JSON.stringify({ val }))
  }
  timer(plats: number, sekunder?: number): void {
    this.log('timer', JSON.stringify(sekunder != null ? { plats, sekunder } : { plats }))
  }
  ljud(id: string): void {
    this.log('ljud', id)
  }
  status(s: StatusSnapshot): void {
    // Kompakt i pilot-loggen (undvik brus): fas + steg + väntar.
    this.log('status', `${s.fas} steg ${s.stepIndex + 1}/${s.stepTotal} ${s.stepTyp ?? '—'}${s.awaitingNext ? ' (väntar)' : ''}`)
  }

  // Ingen hårdvara i ren pilot — callbackarna sparas men fyras aldrig.
  onKnapp(_cb: (e: KnappEvent) => void): void {}
  onGm(_cb: (e: GmEvent) => void): void {}
  close(): void {}
}
