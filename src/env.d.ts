/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sätts vid bygget för Node-hosten → appen använder wss://<host><path> som relä. */
  readonly VITE_RELAY_PATH?: string
  /** Sätts av GitHub Pages-workflowen (t.ex. '/utmana-experten/'). */
  readonly VITE_BASE?: string
  /** Override av /assess-gatewayns bas-URL (annars localhost:8787). */
  readonly VITE_ASSESS_URL?: string
  /** MQTT-over-WebSocket-URL till riggsömmen (t.ex. ws://localhost:9001). Tom = LogBus. */
  readonly VITE_MQTT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
