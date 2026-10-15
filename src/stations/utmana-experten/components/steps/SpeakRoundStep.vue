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
const liveText = computed(() => (useManual.value ? manualText.value : capture.transcript.value))
const secondsLeft = computed(() => Math.max(0, Math.ceil((capture.remainingMs.value ?? 0) / 1000)))
const timer = computed(() => `00:${String(secondsLeft.value).padStart(2, '0')}`)

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
      <textarea v-else v-model="manualText" rows="3" class="mic__fallback" placeholder="Rösten fångas inte — skriv in i stället" />
      <div class="mic__timer">⏱ <b>{{ timer }}</b> kvar · valfri knapp = KLAR ▸</div>
    </div>
  </div>
</template>
