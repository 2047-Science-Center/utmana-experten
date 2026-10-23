<script setup lang="ts">
/**
 * SPELLEDAR-FÖNSTRET — egen sida, egen skärm/enhet. Ingen Pinia, ingen
 * spellogik: den speglar stationens motor via <root>/status (retained) och
 * styr den via <root>/gm/* — samma söm som Blocks-dirigenten. Öppnas med
 * ?mqtt=ws://<station-ip>:9001 (annars fylls brokern i här och sparas lokalt).
 *
 * Full live-status: fas · format · läge · steg X/Y · väntar (NÄSTA pulsar) ·
 * paus · master · röster per plats. Testknapparna simulerar bordsknapparna och
 * är märkta efter aktuellt formats svarsalternativ (slottar).
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import { SpelledareLink } from './SpelledareLink'
import { FORMATS } from '../formats'
import type { StatusSnapshot } from '@/station-kit/adapters/rig/Rig'

const STEP_LABEL: Record<string, string> = {
  present: 'Fråga',
  vote: 'Röstning',
  speak_round: 'Tänk-tur',
  assess: 'Bedömning',
  facit: 'Facit',
  feedback: 'Återkoppling',
  clip: 'Verklighet',
  reveal: 'Reveal',
}
/** Fysiska knapp-positioner (vänster/mitt/höger). Testknappen skickar POSITION,
 *  stationen mappar till rätt val (ja/nej/kanske el. namngivet alternativ). */
const POSITIONS = ['nej', 'kanske', 'ja']

const params = new URLSearchParams(window.location.search)
const root = params.get('root') || 'utmanaexperten'
const STORE_KEY = 'utmana.gm.ws'
const defaultWs = params.get('mqtt') || localStorage.getItem(STORE_KEY) || `ws://${window.location.hostname || 'localhost'}:9001`

const wsUrl = ref(defaultWs)
const link = ref<SpelledareLink | null>(null)
const connected = ref(false)
const status = ref<StatusSnapshot | null>(null)
const confirmReset = ref(false)

function connect() {
  if (!wsUrl.value.trim()) return
  try {
    localStorage.setItem(STORE_KEY, wsUrl.value.trim())
  } catch {
    /* privat läge — strunt samma */
  }
  const l = new SpelledareLink(wsUrl.value.trim(), root)
  l.onConnection((c) => (connected.value = c))
  l.onStatus((s) => (status.value = s))
  link.value = l
}
// Auto-anslut om brokern kom via ?mqtt= eller sparats tidigare.
if (params.get('mqtt') || localStorage.getItem(STORE_KEY)) connect()

onBeforeUnmount(() => link.value?.close())

function gm(cmd: string, value = '1') {
  link.value?.gm(cmd, value)
}
function knapp(plats: number, pos: string) {
  link.value?.knapp(plats, pos)
}
function doReset() {
  confirmReset.value = false
  gm('reset')
}

// --- Härledd vy ur status ---
const s = computed(() => status.value)
const phase = computed(() => (s.value?.fas === 'klar' ? 'KLAR' : s.value?.fas === 'kör' ? 'KÖR' : 'LOBBY'))
const stepNo = computed(() => (s.value?.started ? s.value.stepIndex + 1 : 0))
const stepLabel = computed(() => (s.value?.stepTyp ? STEP_LABEL[s.value.stepTyp] ?? s.value.stepTyp : null))
const nextReady = computed(() => s.value?.mode === 'gm' && !!s.value?.awaitingNext)
const voteByPlats = computed<Record<number, string>>(() => {
  const m: Record<number, string> = {}
  for (const v of s.value?.votes ?? []) m[v.plats] = v.val
  return m
})
function slotColor(val: string): string {
  return s.value?.slots.find((sl) => sl.id === val)?.color ?? '#8a5a2a'
}
function seatLabel(plats: number): string {
  return s.value?.namn?.[plats] ?? `Plats ${plats}`
}
const seats = computed(() => s.value?.seats ?? [1, 2, 3, 4, 5, 6])
const slots = computed(() => s.value?.slots ?? [])
</script>

<template>
  <!-- Anslutnings-skärm -->
  <div v-if="!link" class="gm-connect">
    <h1 class="gm-connect__title">Spelledare</h1>
    <p class="gm-connect__hint">Anslut till stationens broker (MQTT-over-WebSocket).</p>
    <label class="gm-connect__field">
      <span>Broker</span>
      <input v-model="wsUrl" class="gm-connect__input" placeholder="ws://192.168.x.x:9001" @keyup.enter="connect" />
    </label>
    <button class="gm-btn gm-btn--start gm-connect__go" @click="connect">Anslut ▸</button>
    <p class="gm-connect__tip">Tips: öppna med <code>?mqtt=ws://&lt;station-ip&gt;:9001</code> så ansluter den direkt.</p>
  </div>

  <!-- Kontrollytan -->
  <div v-else class="gm">
    <header class="gm__top">
      <span class="gm__dot" :class="connected ? 'is-on' : 'is-off'" :title="connected ? 'Ansluten' : 'Ingen kontakt'"></span>
      <span class="gm__phase" :class="'gm__phase--' + phase.toLowerCase()">{{ phase }}</span>
      <span class="gm__fmt">{{ s?.formatNamn ?? '—' }}</span>
      <span class="gm__mode">{{ s?.mode === 'gm' ? 'SPELLEDARE' : 'SJÄLVGÅENDE' }}</span>
      <span v-if="s?.started" class="gm__step">Steg {{ stepNo }}/{{ s?.stepTotal }} · {{ stepLabel }}</span>
      <span v-if="s?.paused" class="gm__badge gm__badge--paus">PAUSAD</span>
      <span v-if="s?.masterLocked" class="gm__badge gm__badge--master">MASTER</span>
      <span v-if="!connected" class="gm__badge gm__badge--off">INGEN KONTAKT</span>
    </header>

    <!-- Format -->
    <section class="gm__group">
      <span class="gm__lbl">Format</span>
      <div class="gm__chips">
        <button
          v-for="f in FORMATS"
          :key="f.id"
          class="gm__chip"
          :class="{ 'is-on': s?.formatId === f.id, 'is-locked': !f.byggd }"
          @click="gm('format', f.id)"
        >
          {{ f.namn }}<span v-if="!f.byggd" class="gm__chip-lock"> 🔒</span>
        </button>
      </div>
    </section>

    <!-- Variant (format med varianter, t.ex. Ändra digs titlar) -->
    <section v-if="s?.varianter?.length" class="gm__group">
      <span class="gm__lbl">Exempel</span>
      <div class="gm__chips">
        <button
          v-for="v in s.varianter"
          :key="v.id"
          class="gm__chip"
          :class="{ 'is-on': s.variantId === v.id }"
          @click="gm('variant', v.id)"
        >
          {{ v.titel }}
        </button>
      </div>
    </section>

    <!-- Läge -->
    <section class="gm__group">
      <span class="gm__lbl">Läge</span>
      <div class="gm__seg">
        <button class="gm__segbtn" :class="{ 'is-on': s?.mode === 'self' }" @click="gm('mode', 'self')">Självgående</button>
        <button class="gm__segbtn" :class="{ 'is-on': s?.mode === 'gm' }" @click="gm('mode', 'gm')">Spelledare</button>
      </div>
    </section>

    <!-- Transport -->
    <section class="gm__transport">
      <button class="gm-btn gm-btn--start" @click="gm('start')">▶ Start</button>
      <button class="gm-btn gm-btn--next" :class="{ 'is-ready': nextReady }" :disabled="!s?.started" @click="gm('nasta')">
        Nästa ▸
      </button>
      <button class="gm-btn" :class="{ 'is-on': s?.paused }" @click="gm('paus')">
        {{ s?.paused ? '▶ Fortsätt' : '⏸ Paus' }}
      </button>
    </section>

    <!-- Master + omstart -->
    <section class="gm__group gm__group--row">
      <button class="gm-btn gm-btn--master" :class="{ 'is-on': s?.masterLocked }" @click="gm('master', s?.masterLocked ? '0' : '1')">
        Master {{ s?.masterLocked ? 'PÅ' : 'av' }}
      </button>
      <template v-if="!confirmReset">
        <button class="gm-btn gm-btn--ghost" @click="confirmReset = true">⟲ Omstart</button>
      </template>
      <template v-else>
        <button class="gm-btn gm-btn--danger" @click="doReset">Ja, släck</button>
        <button class="gm-btn gm-btn--ghost" @click="confirmReset = false">Avbryt</button>
      </template>
    </section>

    <!-- Live röster + testknappar per plats -->
    <section class="gm__group">
      <span class="gm__lbl">Platser {{ s?.stepTyp === 'vote' ? '· röstar nu' : '' }}</span>
      <div class="gm__seats">
        <div v-for="plats in seats" :key="plats" class="gm__seat" :class="{ 'is-active': s?.activePlats === plats }">
          <span class="gm__seat-id">P{{ plats }}</span>
          <span class="gm__seat-name">{{ seatLabel(plats) }}</span>
          <span class="gm__seat-vote" :style="{ background: voteByPlats[plats] ? slotColor(voteByPlats[plats]) : 'transparent', borderColor: voteByPlats[plats] ? slotColor(voteByPlats[plats]) : 'var(--birch)' }"></span>
          <span class="gm__seat-btns">
            <button
              v-for="(slot, i) in slots"
              :key="slot.id"
              class="gm__vote"
              :style="{ color: slot.color }"
              :title="slot.label"
              @click="knapp(plats, POSITIONS[i])"
            >
              {{ slot.label }}
            </button>
          </span>
        </div>
      </div>
      <button
        v-if="s?.stepTyp === 'speak_round' && s?.activePlats"
        class="gm-btn gm-btn--next gm__klar"
        @click="knapp(s.activePlats, 'ja')"
      >
        Klar ▸ ({{ seatLabel(s.activePlats) }})
      </button>
    </section>

    <p class="gm__hint">
      Allt går via <code>{{ root }}/gm/*</code> — samma söm som Blocks-dirigenten.
      Stationen speglas via <code>{{ root }}/status</code>.
    </p>
  </div>
</template>

<style scoped>
/* Full sida i Marquee-temat (gameshow.css ger tokens). Touch-vänligt ≥44px. */
.gm,
.gm-connect {
  min-height: 100vh;
  box-sizing: border-box;
  padding: clamp(0.8rem, 3vw, 2rem);
  background: var(--petrol, #0c333c);
  color: var(--creme, #f2e7cf);
  font-family: var(--f-text, system-ui);
}
.gm {
  display: flex;
  flex-direction: column;
  gap: clamp(0.8rem, 2.4vw, 1.4rem);
  max-width: 760px;
  margin: 0 auto;
}

/* Connect */
.gm-connect {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}
.gm-connect__title { font-family: var(--f-disp, sans-serif); font-weight: 800; font-size: 2.4rem; margin: 0; }
.gm-connect__hint { color: var(--creme-dim, #c98a4a); margin: 0; }
.gm-connect__field { display: flex; flex-direction: column; gap: 0.4rem; width: min(90vw, 420px); text-align: left; }
.gm-connect__field span { font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--birch-lt, #c89b5e); }
.gm-connect__input {
  font-family: var(--f-text, system-ui); font-size: 1.1rem; padding: 0.7em 0.8em;
  color: var(--creme, #f2e7cf); background: var(--panel, #0a2930);
  border: 1px solid var(--birch, #8a5a2a); border-radius: 12px; outline: none;
}
.gm-connect__input:focus { border-color: var(--orange, #d4682e); }
.gm-connect__go { min-width: 220px; }
.gm-connect__tip { font-size: 0.8rem; color: var(--creme-dim, #c98a4a); }
.gm-connect__tip code, .gm__hint code { color: var(--orange, #d4682e); }

/* Topprad */
.gm__top {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.7rem;
  font-size: 0.82rem; color: var(--creme-dim, #c98a4a);
  padding-bottom: 0.6rem; border-bottom: 1px solid var(--birch, #8a5a2a);
}
.gm__dot { width: 0.7em; height: 0.7em; border-radius: 50%; }
.gm__dot.is-on { background: var(--ja, #36b34a); box-shadow: 0 0 8px var(--ja, #36b34a); }
.gm__dot.is-off { background: var(--nej, #e23b2e); }
.gm__phase {
  font-family: var(--f-disp, sans-serif); font-weight: 800; letter-spacing: 0.1em;
  padding: 0.15em 0.7em; border-radius: 999px; color: var(--petrol, #0c333c); background: var(--birch-lt, #c89b5e);
}
.gm__phase--kör { background: var(--ja, #36b34a); }
.gm__phase--klar { background: var(--orange, #d4682e); }
.gm__fmt { color: var(--creme, #f2e7cf); font-weight: 700; font-size: 0.95rem; }
.gm__mode { letter-spacing: 0.06em; }
.gm__step { color: var(--birch-lt, #c89b5e); }
.gm__badge { font-family: var(--f-disp, sans-serif); font-weight: 700; letter-spacing: 0.08em; padding: 0.12em 0.6em; border-radius: 999px; }
.gm__badge--paus { color: var(--petrol, #0c333c); background: var(--kanske, #f2c021); }
.gm__badge--master { color: #fff; background: var(--nej, #e23b2e); }
.gm__badge--off { color: #fff; background: var(--nej, #e23b2e); }

/* Grupper */
.gm__group { display: flex; flex-direction: column; gap: 0.5rem; }
.gm__group--row { flex-direction: row; flex-wrap: wrap; }
.gm__lbl { font-family: var(--f-disp, sans-serif); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--creme-dim, #c98a4a); }

/* Format-chips */
.gm__chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.gm__chip {
  min-height: 44px; padding: 0.4em 0.9em; font-family: var(--f-text, system-ui); font-size: 0.9rem; font-weight: 600;
  color: var(--creme, #f2e7cf); background: var(--panel-2, #072028); border: 1px solid var(--birch, #8a5a2a); border-radius: 999px; cursor: pointer;
}
.gm__chip.is-on { color: var(--petrol, #0c333c); background: var(--birch-lt, #c89b5e); border-color: var(--birch-lt, #c89b5e); }
.gm__chip.is-locked { opacity: 0.5; }
.gm__chip-lock { font-size: 0.8em; }

/* Läge-segment */
.gm__seg { display: flex; border: 1px solid var(--birch, #8a5a2a); border-radius: 999px; overflow: hidden; }
.gm__segbtn { flex: 1; min-height: 48px; font-family: var(--f-disp, sans-serif); font-weight: 700; font-size: 0.95rem; color: var(--creme, #f2e7cf); background: transparent; border: none; cursor: pointer; }
.gm__segbtn.is-on { color: var(--petrol, #0c333c); background: var(--orange, #d4682e); }

/* Transport */
.gm__transport { display: flex; gap: 0.5rem; }
.gm-btn {
  min-height: 56px; flex: 1; padding: 0.5em 0.8em; font-family: var(--f-disp, sans-serif); font-weight: 700; font-size: 1.05rem;
  color: var(--creme, #f2e7cf); background: var(--panel-2, #072028); border: 1px solid var(--birch, #8a5a2a); border-radius: 14px; cursor: pointer;
}
.gm-btn:hover { border-color: var(--birch-lt, #c89b5e); }
.gm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.gm-btn.is-on { color: var(--petrol, #0c333c); background: var(--kanske, #f2c021); border-color: var(--kanske, #f2c021); }
.gm-btn--start { color: var(--petrol, #0c333c); background: var(--ja, #36b34a); border-color: var(--ja, #36b34a); }
.gm-btn--next { color: var(--petrol, #0c333c); background: var(--birch-lt, #c89b5e); border-color: var(--birch-lt, #c89b5e); }
.gm-btn--next.is-ready { background: var(--orange, #d4682e); border-color: var(--orange, #d4682e); color: #fff; animation: gmPulse 1s ease-in-out infinite; }
.gm-btn--master { flex: 1 1 100%; }
.gm-btn--master.is-on { color: #fff; background: var(--nej, #e23b2e); border-color: var(--nej, #e23b2e); }
.gm-btn--ghost { color: var(--creme-dim, #c98a4a); background: transparent; }
.gm-btn--danger { color: #fff; background: var(--nej, #e23b2e); border-color: var(--nej, #e23b2e); }

/* Platser / live-röster + testknappar */
.gm__seats { display: flex; flex-direction: column; gap: 0.4rem; }
.gm__seat { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0.5rem; border-radius: 10px; }
.gm__seat.is-active { background: rgba(242, 231, 207, 0.08); outline: 1px solid var(--birch-lt, #c89b5e); }
.gm__seat-id { width: 2.2em; font-weight: 700; color: var(--creme-dim, #c98a4a); font-size: 0.85rem; }
.gm__seat-name { min-width: 4.5em; font-weight: 600; font-size: 0.9rem; color: var(--creme, #f2e7cf); }
.gm__seat-vote { width: 0.95em; height: 0.95em; border-radius: 50%; border: 1.5px solid; flex: none; }
.gm__seat-btns { display: flex; gap: 0.3rem; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.gm__vote {
  min-height: 40px; padding: 0.3em 0.7em; font-family: var(--f-disp, sans-serif); font-weight: 700; font-size: 0.8rem;
  color: var(--creme, #f2e7cf); background: var(--panel-2, #072028); border: 1px solid currentColor; border-radius: 8px; cursor: pointer;
}
.gm__klar { margin-top: 0.3rem; }

.gm__hint { margin: 0; font-size: 0.75rem; line-height: 1.5; color: var(--creme-dim, #c98a4a); }

@keyframes gmPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 104, 46, 0.5); }
  50% { box-shadow: 0 0 0 7px rgba(212, 104, 46, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .gm-btn--next.is-ready { animation: none; }
}
</style>
