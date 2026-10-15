/**
 * Pilot-identitet: mockar band. Varje anrop ger ett nytt syntetiskt band-id
 * och ett litet namn — så piloten kan spelas utan RFID-hårdvara.
 */

import type { Identity, IdentityGroup } from './Identity'

const NAMES = ['Alva', 'Noah', 'Wilma', 'Liam', 'Ebba', 'Hugo', 'Maja', 'Elias']

export class MockIdentity implements Identity {
  private counter = 0

  async tag(bandId?: string): Promise<IdentityGroup> {
    this.counter += 1
    const id = bandId ?? `mock-band-${this.counter}-${Math.random().toString(36).slice(2, 6)}`
    const name = NAMES[(this.counter - 1) % NAMES.length]
    return {
      grupp: 'mock-grupp',
      medlemmar: [{ band_id: id, name }],
    }
  }
}
