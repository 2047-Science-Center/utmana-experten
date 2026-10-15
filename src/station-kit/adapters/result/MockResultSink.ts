/**
 * Pilot-resultat: loggar payloaden till konsolen i exakt den frysta formen
 * (§5.3) så man ser att per-person-raderna byggs rätt innan riggen kopplas.
 */

import type { ResultSink, ResultPayload } from './ResultSink'

export class MockResultSink implements ResultSink {
  /** Senast skickade payload (bekvämt för pilot-UI/inspektion). */
  last: ResultPayload | null = null

  send(payload: ResultPayload): void {
    this.last = payload
    // eslint-disable-next-line no-console
    console.info('[MockResultSink] station/result + /done', payload)
  }
}
