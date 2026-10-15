/**
 * Adapter-fabrik. EN plats där pilot↔drift avgörs (config.mode). Byter man
 * läge byts adaptrarna — spellogiken rörs aldrig.
 *
 * Utmana experten: transport (skärm-synk, valfri), result (söm, av i pilot),
 * assess (AI — på riktigt i BÅDA lägen), speak (röst-add-on), rig (lager-1-buss).
 */

import { config } from '@/config'

import type { Transport } from './transport/Transport'
import { BroadcastChannelTransport } from './transport/BroadcastChannelTransport'
import { WebSocketTransport } from './transport/WebSocketTransport'

import type { ResultSink } from './result/ResultSink'
import { MockResultSink } from './result/MockResultSink'
import { MqttResultSink } from './result/MqttResultSink'

import type { Assess } from './assess/Assess'
import { HttpAssess } from './assess/HttpAssess'

import type { Speak } from './speak/Speak'
import { HttpSpeak } from './speak/HttpSpeak'
import { NullSpeak } from './speak/NullSpeak'

import type { Rig } from './rig/Rig'
import { LogRig } from './rig/LogRig'
import { MqttRig } from './rig/MqttRig'

export interface Adapters {
  transport: Transport
  result: ResultSink
  /** AI-bedömning (frysta multi-speaker-kontraktet). På riktigt i båda lägen. */
  assess: Assess
  /** NPC-röst-add-on. NullSpeak när config.speak.enabled=false (pilot-default). */
  speak: Speak
  /** Lager-1-rigg: semantiska cues ut, knapp/gm in. */
  rig: Rig
}

/** Transport för ev. skärm↔skärm-synk (samma mönster som Förhandlingen). */
function createTransport(): Transport {
  const room = `station${config.stationN}`
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const net = params.get('net')
    if (net) return new WebSocketTransport(net, params.get('room') ?? room)

    const relayPath = import.meta.env.VITE_RELAY_PATH as string | undefined
    if (relayPath) {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return new WebSocketTransport(`${proto}//${window.location.host}${relayPath}`, room)
    }
  }
  if (config.mode === 'production') {
    return new WebSocketTransport(config.production.wsUrl, room)
  }
  return new BroadcastChannelTransport(`utmanaexperten-station${config.stationN}`)
}

/** Rigg-buss: MQTT-over-WS om en URL finns (config.rig.wsUrl eller ?mqtt=),
 *  annars LogRig (loggar cues; on-screen-knappar driver flödet). */
function createRig(): Rig {
  const root = config.rig.topicRoot
  let wsUrl = config.rig.wsUrl
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('mqtt')
    if (q) wsUrl = q
  }
  if (wsUrl) return new MqttRig(wsUrl, root)
  return new LogRig(root)
}

function createAssess(): Assess {
  return new HttpAssess(config.assess.baseUrl)
}
function createSpeak(): Speak {
  return config.speak.enabled
    ? new HttpSpeak(config.assess.baseUrl, 'utmana', config.speak.rate)
    : new NullSpeak()
}

export function createAdapters(): Adapters {
  return {
    transport: createTransport(),
    result: config.mode === 'production' ? new MqttResultSink(config.stationN) : new MockResultSink(),
    assess: createAssess(),
    speak: createSpeak(),
    rig: createRig(),
  }
}

export type { Transport, ResultSink, Assess, Speak, Rig }
