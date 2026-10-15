/**
 * Drift-identitet: station<N>/rfid ut, station<N>/identity in. STUBB mot
 * riggens frysta kontrakt (§5.2). Fyll i skarp MQTT-klient: publicera taggen,
 * vänta på identity-svaret, resolva Promise.
 */

import type { Identity, IdentityGroup } from './Identity'

export class MqttIdentity implements Identity {
  private rfidTopic: string
  private identityTopic: string

  constructor(stationN: number) {
    this.rfidTopic = `station${stationN}/rfid`
    this.identityTopic = `station${stationN}/identity`
  }

  async tag(_bandId: string): Promise<IdentityGroup> {
    // TODO(drift): publish(this.rfidTopic, _bandId); await svar på identityTopic
    void this.rfidTopic
    void this.identityTopic
    throw new Error('MqttIdentity ej kopplad i piloten (fyll stubben för drift).')
  }
}
