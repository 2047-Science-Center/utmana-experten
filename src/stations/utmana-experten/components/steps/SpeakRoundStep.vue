<script setup lang="ts">
/**
 * speak_round (Designförslag B): den aktiva platsen spotlightas i hästskon,
 * resten dimmas + mörk scrim, och mikrofonens ström växer till ett stort
 * live-transkript. Turen avslutas av timern ELLER aktiv plats "klar"-knapp.
 * Samma Web Speech-fångst som Minnestestet; tangentbords-fallback.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useUtmanaStore } from '../../store/utmanaStore'
import { useSpeechCapture } from '@/station-kit/capture/useSpeechCapture'
import { config } from '@/config'
import Horseshoe from '../Horseshoe.vue'

const store = useUtmanaStore()

const capture = useSpeechCapture({ windowMs: store.currentSpeakSeconds * 1000, lang: config.lang })
const manualText = ref('')
let finalizing = false

const who = computed(() => (store.activePlats ? `${store.displayName(store.activePlats)} har ordet` : ''))
const useManual = computed(() => !capture.supported || capture.error.value != null)
const errReason = computed(() => {
  if (!capture.supported) return 'webbläsaren saknar Web Speech — kör Google Chrome (ej Chromium)'
  switch (capture.error.value) {
    case 'not-allowed':
      return 'mikrofonen blockerad — tillåt mick för sidan'
    case 'no-mic':
      return 'ingen mikrofon hittad — kolla att Ankern är vald som in-enhet'
    case 'no-internet':
      return 'ingen internetanslutning — Web Speech är molnbaserat'
    default:
      return 'rösten fångas inte'
  }
})
const liveText = computed(() => (useManual.value ? manualText.value : capture.transcript.value))
const secondsLeft = computed(() => Math.max(0, Math.ceil((capture.remainingMs.value ?? 0) / 1000)))
const timer = computed(() => `00:${String(secondsLeft.value).padStart(2, '0')}`)

// EN delad mic (default-input) för alla turer. Web Speech kan inte välja/byta
// enhet mitt i en session, så per-spelare-mic kräver en annan capture-motor
// (getUserMedia(deviceId) + streamande STT) — eget pass senare. Turordningen ger
// ändå rätt plats oavsett vilken mic ljudet kom in på.
function startTurn(): void {
  finalizing = false
  manualText.value = ''
  capture.reset()
  if (!useManual.value) capture.start()
}
function finalize(): void {
  if (finalizing || store.activePlats === 0) return
  finalizing = true
  const plats = store.activePlats
  capture.stop()
  const spoken = (capture.finalTranscript.value + ' ' + manualText.value).trim()
  store.endTurn(plats, spoken)
}

watch(
  () => store.activePlats,
  (plats) => {
    if (plats > 0) startTurn()
    else capture.stop()
  },
)
watch(() => store.turnEndSignal, () => finalize())
watch(
  () => capture.remainingMs.value,
  (ms) => {
    if (ms != null && ms <= 0 && store.activePlats > 0) finalize()
  },
)
// Countdown till riggen: skicka timer-cue sista warnAtSeconds (5) sekunderna →
// hjärnan gör röd puls på aktiv plats. (Påverkar inte capturen.)
watch(secondsLeft, (s) => {
  if (s > 0 && s <= config.warnAtSeconds && store.activePlats > 0) store.cueTimer(s)
})
watch(
  () => store.paused,
  (p) => {
    if (useManual.value) return
    if (p) capture.pause()
    else if (store.activePlats > 0) capture.resume()
  },
)
onMounted(() => {
  if (store.activePlats > 0) startTurn()
})
</script>

<template>
  <div class="screen--scene view screen--speak">
    <div class="stage">
      <Horseshoe :dim="true" />
    </div>
    <div class="scrim"></div>
    <div class="mic">
      <span class="mic__who"><span class="mic__live on"></span>{{ who }}</span>
      <p v-if="!useManual" class="mic__text">{{ liveText }}<span class="cursor">▍</span></p>
      <div v-else>
        <p class="mic__err">⚠ {{ errReason }}</p>
        <textarea v-model="manualText" rows="3" class="mic__fallback" placeholder="Skriv in i stället" />
      </div>
      <div class="mic__timer">⏱ <b>{{ timer }}</b> kvar · valfri knapp = KLAR ▸</div>
    </div>
  </div>
</template>
