/**
 * Drift-ljus: publicerar på station<N>/lights. STUBB — fyll i skarp MQTT-klient.
 * Payloadformerna är frysta (§5.1); firmware översätter lucka→pixlar.
 *
 * Mockbart utan hårdvara:
 *   mosquitto_pub -t station0/lights -m '{"hatch":1,"state":"active","winner":null}'
 */

import type { Lights } from './Lights'
import type { HatchLight } from './Lights'

export interface MqttPublisher {
  publish(topic: string, payload: string): void
}

export class MqttLights implements Lights {
  private topic: string

  constructor(
    stationN: number,
    private publisher?: MqttPublisher,
  ) {
    this.topic = `station${stationN}/lights`
  }

  set(lights: HatchLight[]): void {
    for (const l of lights) {
      const payload = JSON.stringify({
        hatch: l.hatch,
        state: l.state,
        winner: l.winner,
      })
      // TODO(drift): koppla mqtt-klient
      this.publisher?.publish(this.topic, payload)
    }
  }

  reset(): void {
    this.publisher?.publish(this.topic, JSON.stringify({ state: 'reset' }))
  }
}
