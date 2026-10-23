<script setup lang="ts">
/**
 * Dedikerad SPELLEDAR-kontrollyta (Marquee-tema). EN väg för både pilot och
 * drift: varje knapp går genom exakt samma söm som Blocks-dirigenten publicerar
 * på `utmanaexperten/gm/*` → `store.onGm({ cmd, value })`. Inga pixlar, ingen
 * egen spellogik — bara dirigering.
 *
 *   FORMAT · LÄGE (self/gm) · START · NÄSTA ▸ · PAUS · MASTER · OMSTART
 *
 * I gm gatas varje steg: NÄSTA ▸ pulserar när motorn väntar (awaitingNext).
 * TEST-sektionen simulerar hårdvaru-knapparna (utmanaexperten/knapp) så hela
 * flödet går att köra i webbläsaren utan rigg. Diskret men touch-nåbar.
 */
import { ref, computed } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { FORMATS } from '../formats'
import type { Step } from '../engine/types'

const store = useUtmanaStore()
const open = ref(false)
const showTest = ref(false)
const confirmReset = ref(false)

const STEP_LABEL: Record<Step['typ'], string> = {
  present: 'Fråga',
  vote: 'Röstning',
  speak_round: 'Tänk-tur',
  assess: 'Bedömning',
  facit: 'Facit',
  feedback: 'Återkoppling',
  clip: 'Verklighet',
  reveal: 'Reveal',
}

const total = computed(() => store.steps.length)
const stepNo = computed(() => (store.started ? store.stepIndex + 1 : 0))
const stepLabel = computed(() => (store.stepType ? STEP_LABEL[store.stepType] : null))
const phase = computed(() => {
  if (store.finished) return 'KLAR'
  if (!store.started) return 'LOBBY'
  return 'KÖR'
})
/** NÄSTA ▸ "ropar" när motorn gatat och väntar på spelledaren. */
const nextReady = computed(() => store.mode === 'gm' && store.awaitingNext)

function gm(cmd: string, value = '1') {
  store.onGm({ cmd, value })
}
function doReset() {
  confirmReset.value = false
  gm('reset')
}
</script>

<template>
  <div class="sp">
    <button class="sp__toggle" :class="{ 'sp__toggle--live': nextReady }" @click="open = !open" :aria-expanded="open">
      <span class="sp__toggle-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="7" x2="20" y2="7" /><circle cx="10" cy="7" r="2.3" fill="currentColor" stroke="none" />
          <line x1="4" y1="17" x2="20" y2="17" /><circle cx="15" cy="17" r="2.3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      Spelledare
    </button>

    <div v-if="open" class="sp__body">
      <!-- Status -->
      <div class="sp__status">
        <span class="sp__phase" :class="'sp__phase--' + phase.toLowerCase()">{{ phase }}</span>
        <span class="sp__fmt">{{ store.format?.namn ?? '—' }}</span>
        <span class="sp__mode">{{ store.mode === 'gm' ? 'SPELLEDARE' : 'SJÄLVGÅENDE' }}</span>
        <span v-if="store.started" class="sp__step">Steg {{ stepNo }}/{{ total }} · {{ stepLabel }}</span>
        <span v-if="store.paused" class="sp__badge sp__badge--paus">PAUSAD</span>
        <span v-if="store.masterLocked" class="sp__badge sp__badge--master">MASTER</span>
      </div>

      <!-- Format -->
      <div class="sp__group">
        <span class="sp__lbl">Format</span>
        <div class="sp__chips">
          <button
            v-for="f in FORMATS"
            :key="f.id"
            class="sp__chip"
            :class="{ 'is-on': store.format?.id === f.id }"
            @click="gm('format', f.id)"
          >
            {{ f.namn }}
          </button>
        </div>
      </div>

      <!-- Variant (format med varianter, t.ex. Ändra digs titlar) -->
      <div v-if="store.format?.varianter?.length" class="sp__group">
        <span class="sp__lbl">Exempel</span>
        <div class="sp__chips">
          <button
            v-for="v in store.format.varianter"
            :key="v.id"
            class="sp__chip"
            :class="{ 'is-on': store.activeVariant?.id === v.id }"
            @click="gm('variant', v.id)"
          >
            {{ v.titel }}
          </button>
        </div>
      </div>

      <!-- Läge -->
      <div class="sp__group">
        <span class="sp__lbl">Läge</span>
        <div class="sp__seg">
          <button class="sp__segbtn" :class="{ 'is-on': store.mode === 'self' }" @click="gm('mode', 'self')">Självgående</button>
          <button class="sp__segbtn" :class="{ 'is-on': store.mode === 'gm' }" @click="gm('mode', 'gm')">Spelledare</button>
        </div>
      </div>

      <!-- Transport -->
      <div class="sp__transport">
        <button class="sp__btn sp__btn--start" @click="gm('start')">▶ Start</button>
        <button
          class="sp__btn sp__btn--next"
          :class="{ 'is-ready': nextReady }"
          :disabled="!store.started"
          @click="gm('nasta')"
        >
          Nästa ▸
        </button>
        <button class="sp__btn" :class="{ 'is-on': store.paused }" @click="gm('paus')">
          {{ store.paused ? '▶ Fortsätt' : '⏸ Paus' }}
        </button>
      </div>

      <!-- Master + omstart -->
      <div class="sp__group sp__group--row">
        <button class="sp__btn sp__btn--master" :class="{ 'is-on': store.masterLocked }" @click="gm('master', store.masterLocked ? '0' : '1')">
          Master {{ store.masterLocked ? 'PÅ' : 'av' }}
        </button>
        <template v-if="!confirmReset">
          <button class="sp__btn sp__btn--ghost" @click="confirmReset = true">⟲ Omstart</button>
        </template>
        <template v-else>
          <button class="sp__btn sp__btn--danger" @click="doReset">Ja, släck</button>
          <button class="sp__btn sp__btn--ghost" @click="confirmReset = false">Avbryt</button>
        </template>
      </div>

      <!-- Test: simulera hårdvaru-knappar (utmanaexperten/knapp) -->
      <button class="sp__test-toggle" @click="showTest = !showTest">
        {{ showTest ? '▾' : '▸' }} Test · knappar
      </button>
      <div v-if="showTest" class="sp__test">
        <div v-for="plats in store.seats" :key="plats" class="sp__seat">
          <span class="sp__seatn">P{{ plats }}</span>
          <button class="sp__vote nej" @click="store.onKnapp(plats, 'nej')">Nej</button>
          <button class="sp__vote kanske" @click="store.onKnapp(plats, 'kanske')">Ka</button>
          <button class="sp__vote ja" @click="store.onKnapp(plats, 'ja')">Ja</button>
        </div>
        <button
          v-if="store.stepType === 'speak_round' && store.activePlats"
          class="sp__btn sp__btn--next"
          @click="store.onKnapp(store.activePlats, 'ja')"
        >
          Klar ▸ (plats {{ store.activePlats }})
        </button>
      </div>

      <p class="sp__hint">
        Allt går via <code>utmanaexperten/gm/*</code> — samma söm som Blocks-dirigenten.
        I drift sitter knapparna på borden.
      </p>
    </div>
  </div>
</template>

<style scoped>
.sp {
  position: fixed;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 320;
  font-family: var(--f-text, system-ui);
  text-align: left;
}

/* Diskret men nåbar togglepil */
.sp__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  min-height: 44px;
  padding: 0.5em 1em;
  margin-left: auto;
  font-family: var(--f-disp, sans-serif);
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.04em;
  color: var(--creme, #f2e7cf);
  background: var(--panel-2, #072028);
  border: 1px solid var(--birch, #8a5a2a);
  border-radius: 999px;
  cursor: pointer;
  opacity: 0.8;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.4);
  float: right;
}
.sp__toggle:hover { opacity: 1; }
.sp__toggle-ic { color: var(--orange, #d4682e); display: inline-flex; font-size: 1.1em; }
.sp__toggle--live {
  opacity: 1;
  border-color: var(--orange, #d4682e);
  animation: spPulse 1.2s ease-in-out infinite;
}

.sp__body {
  clear: both;
  margin-top: 0.5rem;
  width: min(92vw, 340px);
  max-height: 82vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem;
  background: var(--panel, #0a2930);
  border: 1px solid var(--birch, #8a5a2a);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}

/* Status */
.sp__status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  align-items: center;
  font-size: 0.72rem;
  color: var(--creme-dim, #c98a4a);
}
.sp__phase {
  font-family: var(--f-disp, sans-serif);
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 0.15em 0.6em;
  border-radius: 999px;
  color: var(--petrol, #0c333c);
  background: var(--birch-lt, #c89b5e);
}
.sp__phase--kör { background: var(--ja, #36b34a); }
.sp__phase--klar { background: var(--orange, #d4682e); }
.sp__fmt { color: var(--creme, #f2e7cf); font-weight: 700; }
.sp__mode { letter-spacing: 0.06em; }
.sp__step { width: 100%; color: var(--birch-lt, #c89b5e); }
.sp__badge {
  font-family: var(--f-disp, sans-serif);
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.12em 0.55em;
  border-radius: 999px;
}
.sp__badge--paus { color: var(--petrol, #0c333c); background: var(--kanske, #f2c021); }
.sp__badge--master { color: #fff; background: var(--nej, #e23b2e); }

/* Grupper */
.sp__group { display: flex; flex-direction: column; gap: 0.4rem; }
.sp__group--row { flex-direction: row; flex-wrap: wrap; gap: 0.4rem; }
.sp__lbl {
  font-family: var(--f-disp, sans-serif);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--creme-dim, #c98a4a);
}

/* Format-chips */
.sp__chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.sp__chip {
  min-height: 38px;
  padding: 0.35em 0.75em;
  font-family: var(--f-text, system-ui);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--creme, #f2e7cf);
  background: var(--panel-2, #072028);
  border: 1px solid var(--birch, #8a5a2a);
  border-radius: 999px;
  cursor: pointer;
}
.sp__chip.is-on { color: var(--petrol, #0c333c); background: var(--birch-lt, #c89b5e); border-color: var(--birch-lt, #c89b5e); }

/* Läge-segment */
.sp__seg { display: flex; gap: 0; border: 1px solid var(--birch, #8a5a2a); border-radius: 999px; overflow: hidden; }
.sp__segbtn {
  flex: 1;
  min-height: 44px;
  font-family: var(--f-disp, sans-serif);
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--creme, #f2e7cf);
  background: transparent;
  border: none;
  cursor: pointer;
}
.sp__segbtn.is-on { color: var(--petrol, #0c333c); background: var(--orange, #d4682e); }

/* Transport */
.sp__transport { display: flex; gap: 0.4rem; }
.sp__btn {
  min-height: 48px;
  flex: 1;
  padding: 0.5em 0.7em;
  font-family: var(--f-disp, sans-serif);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--creme, #f2e7cf);
  background: var(--panel-2, #072028);
  border: 1px solid var(--birch, #8a5a2a);
  border-radius: 12px;
  cursor: pointer;
}
.sp__btn:hover { border-color: var(--birch-lt, #c89b5e); }
.sp__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sp__btn.is-on { color: var(--petrol, #0c333c); background: var(--kanske, #f2c021); border-color: var(--kanske, #f2c021); }
.sp__btn--start { color: var(--petrol, #0c333c); background: var(--ja, #36b34a); border-color: var(--ja, #36b34a); }
.sp__btn--next { color: var(--petrol, #0c333c); background: var(--birch-lt, #c89b5e); border-color: var(--birch-lt, #c89b5e); }
.sp__btn--next.is-ready { background: var(--orange, #d4682e); border-color: var(--orange, #d4682e); color: #fff; animation: spPulse 1s ease-in-out infinite; }
.sp__btn--master { flex: 1 1 100%; }
.sp__btn--master.is-on { color: #fff; background: var(--nej, #e23b2e); border-color: var(--nej, #e23b2e); }
.sp__btn--ghost { color: var(--creme-dim, #c98a4a); background: transparent; }
.sp__btn--danger { color: #fff; background: var(--nej, #e23b2e); border-color: var(--nej, #e23b2e); }

/* Test */
.sp__test-toggle {
  align-self: flex-start;
  padding: 0.3em 0;
  font-family: var(--f-text, system-ui);
  font-size: 0.72rem;
  color: var(--creme-dim, #c98a4a);
  background: none;
  border: none;
  cursor: pointer;
}
.sp__test { display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid var(--birch, #8a5a2a); padding-top: 0.5rem; }
.sp__seat { display: flex; align-items: center; gap: 0.3rem; }
.sp__seatn { width: 2.1em; font-size: 0.72rem; color: var(--creme-dim, #c98a4a); }
.sp__vote {
  flex: 1;
  min-height: 40px;
  font-family: var(--f-disp, sans-serif);
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--creme, #f2e7cf);
  background: var(--panel-2, #072028);
  border: 1px solid currentColor;
  border-radius: 8px;
  cursor: pointer;
}
.sp__vote.nej { color: var(--nej, #e23b2e); }
.sp__vote.kanske { color: var(--kanske, #f2c021); }
.sp__vote.ja { color: var(--ja, #36b34a); }

.sp__hint { margin: 0; font-size: 0.68rem; line-height: 1.4; color: var(--creme-dim, #c98a4a); }
.sp__hint code { color: var(--orange, #d4682e); }

@keyframes spPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212, 104, 46, 0.5); }
  50% { box-shadow: 0 0 0 6px rgba(212, 104, 46, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .sp__toggle--live, .sp__btn--next.is-ready { animation: none; }
}
</style>
