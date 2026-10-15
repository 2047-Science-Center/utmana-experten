/**
 * Pilot-transport: BroadcastChannel (samma dator/webbläsare). Två fönster som
 * öppnar samma kanal ser varandras meddelanden direkt. Sen-anslutande fönster
 * skickar 'hello' → övriga svarar med aktuell snapshot.
 */

import type { Transport, TransportHandler, TransportMessage } from './Transport'

export class BroadcastChannelTransport implements Transport {
  private channel: BroadcastChannel
  private handlers = new Set<TransportHandler>()

  constructor(channelName = 'forhandlingen') {
    this.channel = new BroadcastChannel(channelName)
    this.channel.onmessage = (ev: MessageEvent<TransportMessage>) => {
      for (const h of this.handlers) h(ev.data)
    }
  }

  send(msg: TransportMessage): void {
    this.channel.postMessage(msg)
  }

  subscribe(handler: TransportHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  close(): void {
    this.handlers.clear()
    this.channel.close()
  }
}
