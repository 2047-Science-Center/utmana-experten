/**
 * WebSocket-transport — skärm↔skärm-synk över nätet (olika datorer). Samma
 * statmodell och samma meddelanden som pilotens BroadcastChannel; skillnaden är
 * bara att de går via en liten relä-server (server/relay.mjs) i stället för
 * webbläsarens lokala kanal.
 *
 * Används i piloten för online-test (två spelare på var sin dator) OCH i drift
 * (lokal NUC-orkestrator). Väljs via URL: ?net=<wsUrl>&room=<rum>.
 * Auto-återansluter med enkel backoff.
 */

import type { Transport, TransportHandler, TransportMessage } from './Transport'

export class WebSocketTransport implements Transport {
  private handlers = new Set<TransportHandler>()
  private ws: WebSocket | null = null
  private queue: TransportMessage[] = []
  private closed = false
  private reconnectMs = 500
  private url: string

  constructor(baseUrl: string, room = 'forhandlingen') {
    const sep = baseUrl.includes('?') ? '&' : '?'
    this.url = `${baseUrl}${sep}room=${encodeURIComponent(room)}`
    this.connect()
  }

  private connect() {
    if (this.closed) return
    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }
    this.ws.onopen = () => {
      this.reconnectMs = 500
      // Töm kö som samlats innan anslutning.
      for (const m of this.queue.splice(0)) this.rawSend(m)
    }
    this.ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data as string) as TransportMessage
        for (const h of this.handlers) h(msg)
      } catch {
        // ignorera trasiga meddelanden
      }
    }
    this.ws.onclose = () => {
      this.ws = null
      this.scheduleReconnect()
    }
    this.ws.onerror = () => this.ws?.close()
  }

  private scheduleReconnect() {
    if (this.closed) return
    setTimeout(() => this.connect(), this.reconnectMs)
    this.reconnectMs = Math.min(this.reconnectMs * 2, 5000)
  }

  private rawSend(msg: TransportMessage) {
    this.ws?.send(JSON.stringify(msg))
  }

  send(msg: TransportMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.rawSend(msg)
    } else {
      this.queue.push(msg) // skickas vid (åter)anslutning
    }
  }

  subscribe(handler: TransportHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  close(): void {
    this.closed = true
    this.handlers.clear()
    this.ws?.close()
  }
}
