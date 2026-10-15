/**
 * Drift-resultat: publicerar station<N>/result och station<N>/done. STUBB mot
 * det frysta kontraktet (§5.3). Fyll i skarp MQTT-klient. Payloadformen är
 * redan rätt — bara transporten saknas.
 */

import type { ResultSink, ResultPayload } from './ResultSink'
import type { MqttPublisher } from '../lights/MqttLights'

export class MqttResultSink implements ResultSink {
  private resultTopic: string
  private doneTopic: string

  constructor(
    stationN: number,
    private publisher?: MqttPublisher,
  ) {
    this.resultTopic = `station${stationN}/result`
    this.doneTopic = `station${stationN}/done`
  }

  send(payload: ResultPayload): void {
    // TODO(drift): koppla mqtt-klient
    this.publisher?.publish(this.resultTopic, JSON.stringify(payload))
    this.publisher?.publish(this.doneTopic, JSON.stringify({ grupp: payload.grupp }))
  }
}
