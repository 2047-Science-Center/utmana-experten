/**
 * Transport — skärm↔skärm-synk. Semantiska meddelanden (state-snapshots och
 * actions), aldrig pixlar. Samma statmodell i pilot (BroadcastChannel) och
 * drift (WebSocket).
 */

export interface TransportMessage<T = unknown> {
  kind: string
  payload: T
}

export type TransportHandler = (msg: TransportMessage) => void

export interface Transport {
  /** Skicka ett meddelande till övriga skärmar. */
  send(msg: TransportMessage): void
  /** Prenumerera på inkommande meddelanden. Returnerar avprenumerera-funktion. */
  subscribe(handler: TransportHandler): () => void
  close(): void
}
